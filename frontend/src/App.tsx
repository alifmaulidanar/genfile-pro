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

      // const response = await axios.post(`${process.env.PROD_URL}`, {
      const response = await axios.post("https://genfilepro.alifmaulidanar.com/generate", {
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
    <div className="flex items-start justify-center max-h-screen min-h-screen">
      <Card className="max-h-screen p-4 my-4 w-120">
        <CardHeader>
          <h1 className="text-xl font-semibold text-center md:text-2xl">GenFile Pro</h1>
          <h2 className="text-sm font-medium text-center md:text-md">
            Generate Perfect Samples, Every Time.
          </h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-center md:text-md">
            Your ultimate tool for generating sample files in any format or size. Fast, customizable, and crafted to perfection.
          </p>

          <Separator className='my-8' />

          <div className='grid max-h-screen grid-rows-1'>
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

          <div className='flex flex-col items-center mx-auto my-8 w-fit'>
            <Button onClick={handleGenerate}>Generate File</Button>
            <div>
              {errorMessage && <p className="mt-2 text-sm text-red-500">{errorMessage}</p>}
            </div>
          </div>

          <div className="relative mt-4 text-center">
            {fileUrl && (
              <div className="relative">
                {isGenerating && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white gap-y-2 opacity-70">
                    <p className="text-sm text-black">Loading...</p>
                    <Progress.Root
                      className="relative w-16 h-2 overflow-hidden bg-white rounded-full"
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
                  <img src={fileUrl} alt="Generated file preview for sample JPG, PNG, JPEG" className="max-w-full mx-auto mb-2 max-h-32" />
                ) : (
                  <embed src={fileUrl} type="application/pdf" className="max-w-full mx-auto mb-2 max-h-fit" />
                )}
              </div>
            )}

            {fileUrl && !isGenerating && (
              <Button onClick={handleDownload} className="mt-2 text-white">
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