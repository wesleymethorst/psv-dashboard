import { createCanvas, loadImage, Image } from 'canvas';
import * as ort from 'onnxruntime-node';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

interface Detection {
  label: string;
  confidence: number;
  box: { x: number; y: number; width: number; height: number };
}

const DB_CONFIG = {
  host: process.env.DB_HOST || '192.168.150.30',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'remote',
  password: process.env.DB_PASSWORD || 'remote',
  database: process.env.DB_NAME || 'psv_dev',
};

let model: ort.InferenceSession | null = null;
let classLabels: string[] = [];

async function loadModel() {
  if (model) return;
  
  const modelPath = path.join(process.cwd(), 'public', 'lib', 'models', 'best.onnx');
  const classesPath = path.join(process.cwd(), 'public', 'lib', 'models', 'classes.txt');
  
  console.log('Loading ONNX model...');
  model = await ort.InferenceSession.create(modelPath);
  
  const classesContent = fs.readFileSync(classesPath, 'utf-8');
  classLabels = classesContent.split('\n').filter(line => line.trim());
  
  console.log(`Model loaded with ${classLabels.length} classes`);
}

function preprocessImage(img: Image): { tensor: ort.Tensor; scaleX: number; scaleY: number; offsetX: number; offsetY: number } {
  const canvas = createCanvas(640, 640);
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 640, 640);
  
  const imgWidth = img.width;
  const imgHeight = img.height;
  const scale = Math.min(640 / imgWidth, 640 / imgHeight);
  const newWidth = imgWidth * scale;
  const newHeight = imgHeight * scale;
  const offsetX = (640 - newWidth) / 2;
  const offsetY = (640 - newHeight) / 2;
  
  ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);
  
  const imageData = ctx.getImageData(0, 0, 640, 640);
  const data = imageData.data;
  
  const float32Data = new Float32Array(3 * 640 * 640);
  for (let i = 0; i < 640 * 640; i++) {
    float32Data[i] = data[i * 4] / 255.0;
    float32Data[640 * 640 + i] = data[i * 4 + 1] / 255.0;
    float32Data[2 * 640 * 640 + i] = data[i * 4 + 2] / 255.0;
  }
  
  const tensor = new ort.Tensor('float32', float32Data, [1, 3, 640, 640]);
  
  return {
    tensor,
    scaleX: scale,
    scaleY: scale,
    offsetX,
    offsetY,
  };
}

function processOutput(output: ort.Tensor, scaleX: number, scaleY: number, offsetX: number, offsetY: number, confidenceThreshold: number): Detection[] {
  const data = output.data as Float32Array;
  const shape = output.dims;
  
  const detections: Detection[] = [];
  const numClasses = classLabels.length;
  const numPredictions = shape[2];
  
  for (let i = 0; i < numPredictions; i++) {
    const classScores: number[] = [];
    for (let c = 0; c < numClasses; c++) {
      classScores.push(data[(4 + c) * numPredictions + i]);
    }
    
    const maxScore = Math.max(...classScores);
    const classIndex = classScores.indexOf(maxScore);
    
    if (maxScore >= confidenceThreshold) {
      const centerX = data[0 * numPredictions + i];
      const centerY = data[1 * numPredictions + i];
      const width = data[2 * numPredictions + i];
      const height = data[3 * numPredictions + i];
      
      const x = ((centerX - width / 2) - offsetX) / scaleX;
      const y = ((centerY - height / 2) - offsetY) / scaleY;
      const w = width / scaleX;
      const h = height / scaleY;
      
      detections.push({
        label: classLabels[classIndex],
        confidence: maxScore,
        box: { x, y, width: w, height: h },
      });
    }
  }
  
  return detections;
}

function calculateIoU(box1: Detection['box'], box2: Detection['box']): number {
  const x1 = Math.max(box1.x, box2.x);
  const y1 = Math.max(box1.y, box2.y);
  const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
  const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);
  
  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const area1 = box1.width * box1.height;
  const area2 = box2.width * box2.height;
  const union = area1 + area2 - intersection;
  
  return intersection / union;
}

function nms(detections: Detection[], iouThreshold: number = 0.45): Detection[] {
  const sorted = detections.sort((a, b) => b.confidence - a.confidence);
  const result: Detection[] = [];
  
  for (const detection of sorted) {
    let keep = true;
    
    for (const selected of result) {
      if (detection.label === selected.label) {
        const iou = calculateIoU(detection.box, selected.box);
        if (iou > iouThreshold) {
          keep = false;
          break;
        }
      }
    }
    
    if (keep) {
      result.push(detection);
    }
  }
  
  return result;
}

async function detectLogos(imageUrl: string, confidenceThreshold: number): Promise<Detection[]> {
  await loadModel();
  if (!model) throw new Error('Model not loaded');
  
  const img = await loadImage(imageUrl);
  const { tensor, scaleX, scaleY, offsetX, offsetY } = preprocessImage(img);
  
  const feeds = { images: tensor };
  const results = await model.run(feeds);
  const output = results[Object.keys(results)[0]];
  
  const detections = processOutput(output, scaleX, scaleY, offsetX, offsetY, confidenceThreshold);
  return nms(detections, 0.45);
}

async function main() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection(DB_CONFIG);
  
  console.log('Fetching posts...');
  const [posts] = await connection.execute('SELECT * FROM instagram_posts LIMIT 1000');
  const postArray = posts as any[];
  
  console.log(`Found ${postArray.length} posts`);
  console.log('Starting bulk detection with 10% confidence threshold...\n');
  
  let processed = 0;
  let failed = 0;
  
  for (const post of postArray) {
    try {
      console.log(`[${processed + 1}/${postArray.length}] Processing post ${post.id} (${post.shortcode})...`);
      
      const imageUrl = `https://www.instagram.com/p/${post.shortcode}/media/?size=l`;
      const detections = await detectLogos(imageUrl, 0.5);
      
      console.log(`  Found ${detections.length} detections`);
      
      if (detections.length > 0) {
        await connection.execute('DELETE FROM logo_detections WHERE post_id = ?', [post.id]);
        
        const values: any[] = [];
        detections.forEach(det => {
          values.push(
            post.id,
            det.label,
            det.confidence,
            det.box.x,
            det.box.y,
            det.box.width,
            det.box.height,
            'bulk_script',
            0.1
          );
        });
        
        const placeholders = detections.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
        const sql = `INSERT INTO logo_detections 
          (post_id, logo_label, confidence, box_x, box_y, box_width, box_height, model_version, confidence_threshold) 
          VALUES ${placeholders}`;
        
        await connection.execute(sql, values);
        console.log(`  Saved to database`);
      }
      
      processed++;
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`  Failed: ${error}`);
      failed++;
    }
  }
  
  await connection.end();
  
  console.log('\n=== Summary ===');
  console.log(`Processed: ${processed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success rate: ${((processed - failed) / processed * 100).toFixed(1)}%`);
}

main().catch(console.error);
