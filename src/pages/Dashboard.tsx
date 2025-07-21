import { useState, useRef } from 'react';
import { getCurrentUser, logout } from '@/lib/auth';
import { getUserHistory, saveFileToHistory, deleteFileFromHistory, clearUserHistory, UploadedFile } from '@/lib/storage';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileSpreadsheet, 
  BarChart3, 
  History, 
  Trash2, 
  LogOut, 
  User,
  Download,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import DataTable from '@/components/DataTable';
import Chart2D from '@/components/Chart2D';
import Chart3D from '@/components/Chart3D';

const Dashboard = () => {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentFile, setCurrentFile] = useState<UploadedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedChart, setSelectedChart] = useState<'2d' | '3d' | null>(null);
  const [xColumn, setXColumn] = useState('');
  const [yColumn, setYColumn] = useState('');

  const history = getUserHistory(user?.id || '');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an Excel file (.xlsx or .xls)",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      const [headers, ...rows] = jsonData as any[][];
      
      const uploadedFile: UploadedFile = {
        id: Date.now().toString(),
        name: file.name,
        data: [headers, ...rows],
        columns: headers,
        uploadedAt: new Date()
      };

      setCurrentFile(uploadedFile);
      saveFileToHistory(user?.id || '', uploadedFile);
      
      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been processed and is ready for analysis.`
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to process the Excel file. Please try again.",
        variant: "destructive"
      });
    }
    
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const loadFileFromHistory = (file: UploadedFile) => {
    setCurrentFile(file);
    setShowHistory(false);
    toast({
      title: "File loaded",
      description: `${file.name} has been loaded for analysis.`
    });
  };

  const deleteFile = (fileId: string) => {
    deleteFileFromHistory(user?.id || '', fileId);
    if (currentFile?.id === fileId) {
      setCurrentFile(null);
    }
    toast({
      title: "File deleted",
      description: "File has been removed from your history."
    });
  };

  const clearHistory = () => {
    clearUserHistory(user?.id || '');
    setCurrentFile(null);
    toast({
      title: "History cleared",
      description: "All your files have been removed."
    });
  };

  const getNumericColumns = () => {
    if (!currentFile) return [];
    const [headers, ...rows] = currentFile.data;
    return headers.filter((header, index) => {
      return rows.some(row => !isNaN(Number(row[index])) && row[index] !== '');
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-card-foreground">Excel Analytics Platform</h1>
              <p className="text-sm text-muted-foreground">Data visualization made simple</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-card-foreground font-medium">{user?.username}</span>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="btn-secondary"
            >
              <History className="h-4 w-4 mr-2" />
              History ({history.length})
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* History Panel */}
        {showHistory && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Upload History</CardTitle>
                  <CardDescription>Your previously uploaded files</CardDescription>
                </div>
                {history.length > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={clearHistory}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No files uploaded yet</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {history.map((file) => (
                    <Card key={file.id} className="bg-muted">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <FileSpreadsheet className="h-4 w-4 text-primary flex-shrink-0" />
                              <span className="font-medium truncate">{file.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-3">
                              {new Date(file.uploadedAt).toLocaleDateString()}
                            </p>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                onClick={() => loadFileFromHistory(file)}
                                className="btn-primary flex-1"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Load
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => deleteFile(file.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Upload Excel File</span>
            </CardTitle>
            <CardDescription>
              Upload an Excel file (.xlsx or .xls) to start analyzing your data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="upload-zone">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                id="file-upload"
              />
              <Label 
                htmlFor="file-upload" 
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <div className="bg-primary/10 rounded-full p-4">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Choose Excel file</p>
                  <p className="text-sm text-muted-foreground">or drag and drop here</p>
                </div>
              </Label>
              
              {uploading && (
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <div className="loading-spinner" />
                  <span>Processing file...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Display and Visualization */}
        {currentFile && (
          <>
            {/* Data Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Data Preview: {currentFile.name}</span>
                  <Badge variant="secondary">
                    {currentFile.data.length - 1} rows × {currentFile.columns.length} columns
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable data={currentFile.data} />
              </CardContent>
            </Card>

            {/* Chart Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Create Visualizations</CardTitle>
                <CardDescription>
                  Select columns to generate interactive charts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="x-column">X-axis (Categories)</Label>
                    <select 
                      id="x-column"
                      value={xColumn}
                      onChange={(e) => setXColumn(e.target.value)}
                      className="w-full mt-1 p-2 bg-input border border-border rounded-md focus:ring-primary"
                    >
                      <option value="">Select column...</option>
                      {currentFile.columns.map((column) => (
                        <option key={column} value={column}>{column}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="y-column">Y-axis (Values)</Label>
                    <select 
                      id="y-column"
                      value={yColumn}
                      onChange={(e) => setYColumn(e.target.value)}
                      className="w-full mt-1 p-2 bg-input border border-border rounded-md focus:ring-primary"
                    >
                      <option value="">Select column...</option>
                      {getNumericColumns().map((column) => (
                        <option key={column} value={column}>{column}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {xColumn && yColumn && (
                  <div className="flex space-x-4">
                    <Button 
                      onClick={() => setSelectedChart('2d')}
                      className={selectedChart === '2d' ? 'btn-primary' : 'btn-secondary'}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      2D Chart
                    </Button>
                    <Button 
                      onClick={() => setSelectedChart('3d')}
                      className={selectedChart === '3d' ? 'btn-primary' : 'btn-secondary'}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      3D Chart
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Charts */}
            {selectedChart && xColumn && yColumn && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {selectedChart === '2d' && (
                  <Chart2D 
                    data={currentFile.data}
                    xColumn={xColumn}
                    yColumn={yColumn}
                  />
                )}
                {selectedChart === '3d' && (
                  <Chart3D 
                    data={currentFile.data}
                    xColumn={xColumn}
                    yColumn={yColumn}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;