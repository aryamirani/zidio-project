import { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import jsPDF from 'jspdf';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Chart2DProps {
  data: any[][];
  xColumn: string;
  yColumn: string;
}

const Chart2D = ({ data, xColumn, yColumn }: Chart2DProps) => {
  const chartRef = useRef<ChartJS<"bar", number[], string>>(null);
  
  if (!data || data.length < 2) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Insufficient data for chart</p>
        </CardContent>
      </Card>
    );
  }

  const [headers, ...rows] = data;
  const xIndex = headers.indexOf(xColumn);
  const yIndex = headers.indexOf(yColumn);

  if (xIndex === -1 || yIndex === -1) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Invalid column selection</p>
        </CardContent>
      </Card>
    );
  }

  // Process data for chart
  const chartData = rows.reduce((acc: { [key: string]: number }, row) => {
    const xValue = String(row[xIndex] || 'Unknown');
    const yValue = Number(row[yIndex]) || 0;
    
    acc[xValue] = (acc[xValue] || 0) + yValue;
    return acc;
  }, {});

  const labels = Object.keys(chartData);
  const values = Object.values(chartData);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e2e8f0'
        }
      },
      title: {
        display: true,
        text: `${yColumn} by ${xColumn}`,
        color: '#e2e8f0',
        font: {
          size: 16
        }
      },
      tooltip: {
        backgroundColor: '#2d3748',
        titleColor: '#e2e8f0',
        bodyColor: '#e2e8f0',
        borderColor: '#4fd1c5',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        grid: {
          color: '#4a5568',
        },
        ticks: {
          color: '#e2e8f0',
          maxRotation: 45,
        }
      },
      y: {
        grid: {
          color: '#4a5568',
        },
        ticks: {
          color: '#e2e8f0',
        }
      }
    }
  };

  const chartDataConfig = {
    labels,
    datasets: [
      {
        label: yColumn,
        data: values,
        backgroundColor: '#4fd1c5',
        borderColor: '#38b2ac',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const downloadPDF = () => {
    if (!chartRef.current) return;
    
    const canvas = chartRef.current.canvas;
    const canvasImg = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgWidth = 280;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(canvasImg, 'PNG', 10, 10, imgWidth, imgHeight);
    pdf.save(`chart-${xColumn}-${yColumn}.pdf`);
  };

  return (
    <Card className="chart-container">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-card-foreground">2D Bar Chart</CardTitle>
          <Button onClick={downloadPDF} className="btn-primary">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <Bar 
            ref={chartRef}
            data={chartDataConfig} 
            options={chartOptions} 
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default Chart2D;