import axios from 'axios';
import { SketchPicker } from 'react-color';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { SetStateAction, useState } from 'react';
import { Separator } from "@/components/ui/separator"
import * as Progress from '@radix-ui/react-progress';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

function App() {
  const [customColor, setCustomColor] = useState('#D0021B');
  const [fileSize, setFileSize] = useState('10');
  const [fileType, setFileType] = useState('png');
  const [fileSizeUnit, setFileSizeUnit] = useState('kb');
  const [width, setWidth] = useState('100');
  const [height, setHeight] = useState('100');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);
    try {
      const sizeInKB = fileSizeUnit === 'mb' ? parseInt(fileSize, 10) * 1024 : parseInt(fileSize, 10);
      const sizeInBytes = sizeInKB * 1024;

      if (sizeInBytes > 500 * 1024 * 1024) {
        setErrorMessage('File size must not exceed 500MB.');
        return;
      }

      setErrorMessage('');
      setProgress(0);

      const response = await axios.post('http://localhost:3011/generate', {
        fileType,
        fileSize: sizeInKB,
        color: customColor,
        fileSizeUnit,
        width: parseInt(width, 10),
        height: parseInt(height, 10)
      });

      setFileUrl(response.data.fileUrl);
      setFileName(response.data.fileName);
      setProgress(100);
      setTimeout(() => setIsGenerating(false), 200);
    } catch (error) {
      console.error('Error generating file:', error);
      setErrorMessage('An error occurred while generating the file.');
      setProgress(0);
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (fileUrl) {
      try {
        const response = await axios.get(fileUrl, { responseType: 'blob' });

        if (response.status === 200) {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        } else {
          throw new Error('File not found');
        }
      } catch (error) {
        console.error('Error downloading file:', error);
        setErrorMessage('File not found. Please regenerate the file.');
      }
    } else {
      setErrorMessage('File not found. Please regenerate the file.');
    }
  };
  
  const handleColorChange = (color: { hex: SetStateAction<string>; }) => {
    setCustomColor(color.hex);
  };

  return (
    <div className="flex justify-center items-start min-h-screen max-h-screen">
      <Card className="w-120 my-4 p-4 max-h-screen">
        <CardHeader>
            <h1 className="text-center text-xl font-semibold md:text-2xl">GenFile Pro</h1>
            <h2 className="text-center text-sm md:text-md font-medium">
            Generate Perfect Samples, Every Time.
            </h2>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm md:text-md">
            Your ultimate tool for generating sample files in any format or size. Fast, customizable, and crafted to perfection.
          </p>

          <Separator className='my-8' />

          <div className='grid grid-rows-1 max-h-screen'>
            <div className='grid grid-cols-3 gap-x-8'>
              {/* Choose File Type */}
              <div className="mb-4">
                <Label htmlFor="fileType">Choose File Type:</Label>
                <RadioGroup id="fileType" value={fileType} onValueChange={setFileType} required>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="png" id="png" aria-label='PNG' />
                    <Label htmlFor="option-png">PNG</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="jpg" id="jpg" aria-label='JPG' />
                    <Label htmlFor="option-jpg">JPG</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="jpeg" id="jpeg" aria-label='JPEG' />
                    <Label htmlFor="option-jpeg">JPEG</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="svg" id="svg" />
                    <Label htmlFor="option-svg">SVG</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pdf" id="pdf" />
                    <Label htmlFor="option-pdf">PDF</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* File Size */}
              <div>
                <div className="mb-4">
                  <Label htmlFor="fileSizeUnit">Choose File Size Unit:</Label>
                  <RadioGroup id="fileSizeUnit" value={fileSizeUnit} onValueChange={setFileSizeUnit} required>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="kb" id="kb" aria-label='kb' />
                      <Label htmlFor="kb">KB</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mb" id="mb" aria-label='mb' />
                      <Label htmlFor="mb">MB</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="mb-4">
                  <Label htmlFor="fileSize">File Size ({fileSizeUnit}):</Label>
                  <Input id="fileSize" type="number" value={fileSize} onChange={(e) => setFileSize(e.target.value)} />
                </div>
                <div className="mb-4">
                  <Label htmlFor="width">Width (px):</Label>
                  <Input id="width" type="number" value={width} onChange={(e) => setWidth(e.target.value)} />
                </div>
                <div className="mb-4">
                  <Label htmlFor="height">Height (px):</Label>
                  <Input id="height" type="number" value={height} onChange={(e) => setHeight(e.target.value)} />
                </div>
              </div>

              {/* Choose Color */}
              {fileType !== 'pdf' && (
                <div className="mb-4">
                  <Label htmlFor="color">Choose Color:</Label>
                  <SketchPicker color={customColor} onChange={handleColorChange} />
                </div>
              )}
            </div>
          </div>

          <div className='flex flex-col w-fit my-8 items-center mx-auto'>
            <Button onClick={handleGenerate}>Generate File</Button>
            <div>
              {errorMessage && <p className="text-red-500 text-sm mt-2">{errorMessage}</p>}
            </div>
          </div>

          <div className="relative mt-4 text-center">
            {fileUrl && (
              <div className="relative">
                {isGenerating && (
                  <div className="absolute inset-0 flex flex-col gap-y-2 items-center justify-center bg-white opacity-70 z-10">
                    <p className="text-black text-sm">Loading...</p>
                    <Progress.Root
                      className="relative overflow-hidden bg-white rounded-full w-16 h-2"
                      style={{ transform: 'translateZ(0)' }}
                      value={progress}
                    >
                      <Progress.Indicator
                        className="bg-black w-full h-full transition-transform duration-[660ms] ease-[cubic-bezier(0.65, 0, 0.35, 1)]"
                        style={{ transform: `translateX(-${100 - progress}%)` }}
                      />
                    </Progress.Root>
                  </div>
                )}

                {fileType !== 'pdf' ? (
                  <img src={fileUrl} alt="Generated file preview for sample JPG, PNG, JPEG" className="mb-2 max-w-full max-h-32 mx-auto" />
                ) : (
                  <embed src={fileUrl} type="application/pdf" className="mb-2 max-w-full max-h-fit mx-auto" />
                )}
              </div>
            )}

            {fileUrl && !isGenerating && (
              <Button onClick={handleDownload} className="text-white mt-2">
                Download File
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;