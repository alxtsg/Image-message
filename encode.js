(function(){

  'use strict';

  var Buffer = require('buffer').Buffer,
    fs = require('fs'),
    process = require('process'),
    spawn = require('child_process').spawn,
    util = require('util'),

    gmPath = 'C:\\Program Files\\GraphicsMagick-1.3.21-Q8\\gm.exe',

    sourceFile = 'C:\\Users\\alext\\Downloads\\test\\origin.png',
    intermediateFile = 'C:\\Users\\alext\\Downloads\\test\\origin.rgb',
    alteredFile = 'C:\\Users\\alext\\Downloads\\test\\altered-encode.rgb',
    destinationFile = 'C:\\Users\\alext\\Downloads\\test\\altered.png',

    sourceImageDimensionString = '30x30',

    intermediateFileSize = 0,

    pixelsBuffer = null,
    alteredPixelsBuffer = null,

    message = 'Hello.',

    getRGBFileStats = null,
    getRGBFileBytes = null,
    processRGBFileBytes = null,
    writeRGBFileBytes = null,
    convertRGBFileBytesToPNG = null;

  getRGBFileStats = function(){
    fs.stat(intermediateFile, function(statError, stats){
      if(statError !== null){
        console.error('Unable to get intermediate file statistics.');
        console.error(statError);
        process.exit(1);
        return;
      }
      intermediateFileSize = stats.size;
      process.nextTick(getRGBFileBytes);
    });
  };

  getRGBFileBytes = function(){
    fs.open(intermediateFile, 'r', function(openError, fileDescriptor){
      pixelsBuffer = new Buffer(intermediateFileSize);
      alteredPixelsBuffer = new Buffer(intermediateFileSize);
      if(openError !== null){
        console.error('Unable to open intermediate file.');
        console.error(openError);
        process.exit(1);
      }
      fs.read(
        fileDescriptor,
        pixelsBuffer,
        0,
        intermediateFileSize,
        null,
        function(readError){
          if(readError !== null){
            console.error('Unable to read intermediate file.');
            console.error(readError);
            process.exit(1);
            return;
          }
          process.nextTick(processRGBFileBytes);
        }
      );
    });
  };

  processRGBFileBytes = function(){
    var pixelIndex = 0,
      pixelByteIndex = 0,
      redValueOffset = 0,
      greenValueOffset = redValueOffset + 1,
      blueValueOffset = greenValueOffset + 1,
      pixelsBufferLength = pixelsBuffer.length,
      redValue = 0,
      greenValue = 0,
      blueValue = 0,
      characterToEncode = null;
    while(pixelByteIndex < pixelsBufferLength){
      redValue = pixelsBuffer.readUInt8(pixelByteIndex + redValueOffset);
      greenValue = pixelsBuffer.readUInt8(pixelByteIndex + greenValueOffset);
      blueValue = pixelsBuffer.readUInt8(pixelByteIndex + blueValueOffset);
      console.log(util.format('Pixel %d', pixelIndex));
      console.log(util.format('R: %d', redValue));
      console.log(util.format('G: %d', greenValue));
      console.log(util.format('B: %d', blueValue));
      characterToEncode = message.charCodeAt(pixelIndex % message.length);
      redValue = (redValue >> 3) << 3;
      greenValue = (greenValue >> 3) << 3;
      blueValue = (blueValue >> 2) << 2;
      redValue += (characterToEncode & 0b11100000) >> 5;
			greenValue += (characterToEncode & 0b00011100) >> 2;
			blueValue += (characterToEncode & 0b00000011);
      console.log(util.format('R0: %d', redValue));
      console.log(util.format('G0: %d', greenValue));
      console.log(util.format('B0: %d', blueValue));
      alteredPixelsBuffer.writeUInt8(
        redValue, pixelByteIndex + redValueOffset);
      alteredPixelsBuffer.writeUInt8(
        greenValue, pixelByteIndex + greenValueOffset);
      alteredPixelsBuffer.writeUInt8(
        blueValue, pixelByteIndex + blueValueOffset);
      pixelIndex += 1;
      pixelByteIndex += 3;
    }
    process.nextTick(writeRGBFileBytes);
  };

  writeRGBFileBytes = function(){
    fs.open(alteredFile, 'w', function(openError, fileDescriptor){
      if(openError !== null){
        console.error('Unable to open altered file.');
        console.error(openError);
        process.exit(1);
      }
      fs.write(
        fileDescriptor,
        alteredPixelsBuffer,
        0,
        alteredPixelsBuffer.length,
        null,
        function(writeError){
          if(writeError !== null){
            console.error('Unable to write altered file.');
            console.error(writeError);
            process.exit(1);
            return;
          }
          process.nextTick(convertRGBFileBytesToPNG);
        }
      );
    });
  };

  convertRGBFileBytesToPNG = function(){
    var commandArguments = [
        'convert',
        '-size',
        sourceImageDimensionString,
        alteredFile,
        destinationFile
      ],
      gm = spawn(gmPath, commandArguments);
    gm.on('error', function(error){
      console.error('Unable to convert image.');
      console.error(error);
      process.exit(1);
    });
    gm.on('close', function(code){
      if(code !== 0){
        console.error(util.format('GraphicsMagick exit with code %d.', code));
        process.exit(1);
        return;
      }
      console.log('Done!');
    });
  };

  (function(){
    var commandArguments = [
        'convert',
        sourceFile,
        intermediateFile
      ],
      gm = spawn(gmPath, commandArguments);
    gm.on('error', function(error){
      console.error('Unable to convert image.');
      console.error(error);
      process.exit(1);
    });
    gm.on('close', function(code){
      if(code !== 0){
        console.error(util.format('GraphicsMagick exit with code %d.', code));
        process.exit(1);
        return;
      }
      process.nextTick(getRGBFileStats);
    });
  }());
}());