import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as THREE from 'three';

interface Chart3DProps {
  data: any[][];
  xColumn: string;
  yColumn: string;
}

const Chart3D = ({ data, xColumn, yColumn }: Chart3DProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene?: THREE.Scene;
    renderer?: THREE.WebGLRenderer;
    camera?: THREE.PerspectiveCamera;
    controls?: any;
  }>({});

  useEffect(() => {
    if (!mountRef.current || !data || data.length < 2) return;

    const [headers, ...rows] = data;
    const xIndex = headers.indexOf(xColumn);
    const yIndex = headers.indexOf(yColumn);

    if (xIndex === -1 || yIndex === -1) return;

    // Clean up previous scene
    if (sceneRef.current.renderer) {
      mountRef.current.removeChild(sceneRef.current.renderer.domElement);
    }

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#2d3748');

    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Process data
    const chartData = rows.reduce((acc: { [key: string]: number }, row) => {
      const xValue = String(row[xIndex] || 'Unknown');
      const yValue = Number(row[yIndex]) || 0;
      
      acc[xValue] = (acc[xValue] || 0) + yValue;
      return acc;
    }, {});

    const labels = Object.keys(chartData);
    const values = Object.values(chartData);
    const maxValue = Math.max(...values);

    // Create bars
    const barGroup = new THREE.Group();
    const barWidth = 0.8;
    const barSpacing = 1.5;

    labels.forEach((label, index) => {
      const value = values[index];
      const height = (value / maxValue) * 5; // Scale height

      // Bar geometry and material
      const geometry = new THREE.BoxGeometry(barWidth, height, barWidth);
      const material = new THREE.MeshLambertMaterial({ 
        color: '#4fd1c5',
        transparent: true,
        opacity: 0.8
      });
      
      const bar = new THREE.Mesh(geometry, material);
      bar.position.x = (index - labels.length / 2) * barSpacing;
      bar.position.y = height / 2;
      
      // Add outline
      const edges = new THREE.EdgesGeometry(geometry);
      const lineMaterial = new THREE.LineBasicMaterial({ color: '#38b2ac', linewidth: 2 });
      const outline = new THREE.LineSegments(edges, lineMaterial);
      bar.add(outline);
      
      barGroup.add(bar);

      // Add label
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 256;
      canvas.height = 64;
      context.fillStyle = '#e2e8f0';
      context.font = '24px Arial';
      context.textAlign = 'center';
      context.fillText(label, 128, 40);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.set(bar.position.x, -1, 0);
      sprite.scale.set(2, 0.5, 1);
      scene.add(sprite);

      // Add value label
      const valueCanvas = document.createElement('canvas');
      const valueContext = valueCanvas.getContext('2d')!;
      valueCanvas.width = 256;
      valueCanvas.height = 64;
      valueContext.fillStyle = '#4fd1c5';
      valueContext.font = 'bold 20px Arial';
      valueContext.textAlign = 'center';
      valueContext.fillText(value.toFixed(0), 128, 40);

      const valueTexture = new THREE.CanvasTexture(valueCanvas);
      const valueSpriteMaterial = new THREE.SpriteMaterial({ map: valueTexture });
      const valueSprite = new THREE.Sprite(valueSpriteMaterial);
      valueSprite.position.set(bar.position.x, height + 0.5, 0);
      valueSprite.scale.set(1.5, 0.4, 1);
      scene.add(valueSprite);
    });

    scene.add(barGroup);

    // Add lighting
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight('#ffffff', 0.8);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    // Add grid
    const gridHelper = new THREE.GridHelper(20, 20, '#4a5568', '#374151');
    gridHelper.position.y = -0.1;
    scene.add(gridHelper);

    // Camera position
    camera.position.set(8, 6, 8);
    camera.lookAt(0, 0, 0);

    // Simple orbit controls (mouse interaction)
    let isMouseDown = false;
    let mouseX = 0, mouseY = 0;
    let targetRotationX = 0, targetRotationY = 0;
    let rotationX = 0, rotationY = 0;

    const onMouseDown = (event: MouseEvent) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isMouseDown) return;
      
      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;
      
      targetRotationY += deltaX * 0.01;
      targetRotationX += deltaY * 0.01;
      
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onWheel = (event: WheelEvent) => {
      camera.position.multiplyScalar(1 + event.deltaY * 0.001);
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('wheel', onWheel);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      rotationX += (targetRotationX - rotationX) * 0.1;
      rotationY += (targetRotationY - rotationY) * 0.1;
      
      barGroup.rotation.x = rotationX;
      barGroup.rotation.y = rotationY;
      
      renderer.render(scene, camera);
    };

    animate();

    // Store references
    sceneRef.current = { scene, renderer, camera };

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('wheel', onWheel);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
    };
  }, [data, xColumn, yColumn]);

  if (!data || data.length < 2) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Insufficient data for 3D chart</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="chart-container">
      <CardHeader>
        <CardTitle className="text-card-foreground">3D Bar Chart</CardTitle>
        <p className="text-sm text-muted-foreground">
          Click and drag to rotate • Scroll to zoom
        </p>
      </CardHeader>
      <CardContent>
        <div 
          ref={mountRef} 
          className="w-full h-96 rounded-lg overflow-hidden"
          style={{ minHeight: '400px' }}
        />
      </CardContent>
    </Card>
  );
};

export default Chart3D;