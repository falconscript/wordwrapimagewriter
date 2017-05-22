"use strict";

var process = require('process'),
    // https://github.com/y-a-v-a/node-gd/blob/stable/docs/index.md
    gd = require('node-gd');


/**
 * WordWrapImageWriter
 *
 * Write lines onto an image wrapping and automatically determining
 * spacing and padding as specified
 *
 */

 class WordWrapImageWriter {
   constructor (args) {
     var lineH = (args.lineHeight === 0) ? 0 : args.lineHeight;
     this.setFontSize(args.fontSize || 24,  (typeof(lineH) != "undefined") ? lineH : -1);

     this.setPaddings({
       top: args.topPadPx === 0 ? 0 : (args.topPadPx || 30),
       right: args.rightPadPx === 0 ? 0 : (args.rightPadPx || 30),
       left: args.leftPadPx === 0 ? 0 : (args.leftPadPx || 30),
       bottom: args.lineBottomPadPx === 0 ? 0 : (args.lineBottomPadPx || 0), // bottom of each line, that is
     });

     this.availableLines = args.availableLines || Infinity; // SET PLEASE?
     this.imgFilename = args.imgFilename || console.log("[!] WWIW - No img filename") || process.exit(1);

     this.currentLineNum = 0;
     this.currentLineOffset = 0;

     if (args.fontFile) {
       this.setFont(args.fontFile);
     }
   }

   // Be sure to call this if you don't call .save! Otherwise it will be
   // A MEMORY LEAK! (.save calls it for you)
   clearImgMemory () {
     this.img.destroy();
   }

   setPaddings (p) {
     this.leftPadPx = p.left || 0;
     this.rightPadPx = p.right || 0;
     this.topPadPx = p.top || 0;
     this.lineBottomPadPx = p.bottom || 0; // bottom of each line, that is

     if (this.img) {
       this.lineLength = this.img.width - this.leftPadPx - this.rightPadPx;
     }
   }

   setFont (fontPath) {
     this.fontFile = fontPath;
   }

   getFont () {
     if (this.fontFile) {
       return this.fontFile;
     } else {
       console.log("[!] WWIW ERR no font specified!!") || process.exit(1);
     }
   }

   setFontSize (fontSize, lineHeight = -1) {
     this.fontSize = fontSize;
     this.lineHeight = lineHeight == -1 ? Math.floor(this.fontSize * 1.2) : lineHeight;
   }

   moveToNextLine (lineNumToMoveTo = -1, offset = -1) {
     this.currentLineNum = (lineNumToMoveTo == -1) ? this.currentLineNum + 1 : lineNumToMoveTo;
     this.currentLineOffset = (offset == -1) ? 0 : offset;
   }

   openImg (callback) {
     gd.openFile(this.imgFilename, (err, img) => {
       if (err) console.log("[!] WWIW IMG open ERR:", err) || process.exit(1);

       this.img = img;
       this.img.alphaBlending(1);
       this.img.saveAlpha(1);

       this.lineLength = this.img.width - this.leftPadPx - this.rightPadPx;

       return callback();
     });
   }

   getExpectedWidthRequired (text) {
     var white = this.img.colorAllocateAlpha(255, 255, 255, 1); // color makes no difference for determining offsets
     var bbox = this.img.stringFT(white, this.getFont(), this.fontSize, 0, 0, 0, text, true);
     return bbox[4] - bbox[0]; // bbox[0] should be 0 anyway
   }

   _determineWritableWordsForCurrentLine (text, startX, rBoundaryX) {
     let words = text.split(' ');
     let wordsThatWontFit = [];
     let times = 0; // infinite loop protection
     let bigwordchararr = [];
     var expectedWidth = -1;

     // find out which words will fit
     do {
       if (!words.length) {
         expectedWidth = 0;
         break;
       }

       expectedWidth = this.getExpectedWidthRequired(words.join(' '));

       // If message fits, break
       if (startX + expectedWidth < rBoundaryX) {
         break;
       } else if (times++ > 400) {
         console.log("[!] WWIW LOOP ERR! MESSAGE WON'T FIT!!? ", text) || process.exit(1);
       }

       // Check if rightmost word fits AN ENTIRE LINE at all, ignoring startX
       let rightmostWord = words[words.length - 1];
       let rightmostWordWidth = this.getExpectedWidthRequired(rightmostWord);

       if (rightmostWordWidth > this.lineLength || bigwordchararr.length) { // !isFirstLine &&
         // This one word and can't fit. Pull a character off it
         bigwordchararr.unshift(rightmostWord.slice(-1));
         words[words.length - 1] = rightmostWord.substr(0, rightmostWord.length - 1);
       } else {
         // pull a word off of it
         wordsThatWontFit.unshift(words.pop());
       }
     } while (true);

     return {
       wordsWontFit:
         (bigwordchararr.length && [bigwordchararr.join('')] || [])
           .concat(wordsThatWontFit).filter((word) => word.length),
       wordsWillFit: words,
       expectedWidth: expectedWidth, // applies to willFit words
     };
   }

   writeText (text, color) {
     do {
       if (!text) break; // all text written

       var fontfile = this.getFont();

       var startX = this.currentLineOffset + this.leftPadPx;
       var rBoundaryX = this.img.width - this.rightPadPx;
       var startY = this.topPadPx + ((this.lineHeight + this.lineBottomPadPx) * this.currentLineNum);
       var info = this._determineWritableWordsForCurrentLine(text, startX, rBoundaryX, fontfile);

       // write what fits
       if (info.wordsWillFit.length) {
           // img.stringFT format: (color, fontfile, fontSize, angle, x, y);
           this.img.stringFT(color, fontfile, this.fontSize, 0, startX, startY, info.wordsWillFit.join(' '));
           this.currentLineOffset += info.expectedWidth;
       }
       // if still stuff, move to next line
       if (info.wordsWontFit.length) {
         this.moveToNextLine();
       }

       text = info.wordsWontFit.join(' '); // .trim?

     } while (this.currentLineNum < this.availableLines); // currentLineNum is 0 indexed

     // Will be set to the text that didn't fit, or empty string if all text fit
     return text;
   }

   save (fname, callback) {
     this.img.savePng(fname, 0, (err) => {
       if (err) console.log("[!] WWIW - ERR saving comment image:", err) || process.exit(1);
       this.clearImgMemory();
       return callback();
     });
   }
 };

module.exports = WordWrapImageWriter;
