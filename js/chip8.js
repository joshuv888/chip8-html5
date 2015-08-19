/* 
 * Author: Maxwell Aguiar Silva
 * E-mail: maxwellaguiarsilva@gmail.com
 * A Chip8 emulator written in javascript and HTML5! 
 * 
*/

// Chip8 constants. 
var DISPLAY_WIDTH = 0x40; // 64 pixels. 
var DISPLAY_HEIGHT = 0x20; // 32 pixels. 
var DISPLAY_ARRAY_SIZE = 0x0100; // 2048 bits. 

var MEMORY_SIZE = 0x1000; // 4096 bytes. 
var NUMBER_OF_REGISTERS = 0x10; // 16 registers, 16 bytes. 
var STACK_SIZE = 0x10; // 16 bytes. 
var PROGRAM_START_ADDRESS = 0x200; // Load ROM into RAM at address 512d ( 0x200 ). 
var ROWS_PER_CHARACTER = 5; // 5 lines to draw a number into screen. 

var NUM_BITS = 0x08; // 8 bits in a byte. 
var BYTE_MASK = 0xFF; // 255 number as 8 bits mask. 


// Listener Pattern
var Listenable = ( function(  ){ 
    
    
    var listeners = new Array(  ); // Listeners Set. 
    
    // Add a listener. 
    this.addListener = ( function( listener ){ 
        
        listeners.push( listener ); 
        
    } ); 
    
    // Dispatch an event for all listeners. 
    this.notify = ( function(  ){ 
        
        var eventName = arguments[ 0 ]; 
        var args = Array.prototype.slice.call( arguments, 1 ); 
        
        for( var listCount = 0; listCount < listeners.length; listCount++ )
            if( typeof listeners[ listCount ][ eventName ] == 'function' )
                listeners[ listCount ][ eventName ]( args ); 
    } ); 
    
    
} ); 


// Chip8 emulator. 
var Chip8 = ( function(  ){ 
    
    
    // Stores and manages the display data. 
    var Display = ( function( chip8StdOut ){ 
        
        
        // Draw column data with the XOR operator. 
        this.draw = ( function( data, left, top ){ 
            
            var flag = false; 
            var firstByteIndex, secondByteIndex, firstByteFilter, secondByteFilter, scroll; 
            var dataWord, filterWord; 
            var count; 
            
            for( count = 0; count < data.length; count++ ) // column height
            { 
                firstByteIndex = Math.floor( ( ( /* column height */ top + count ) * DISPLAY_WIDTH + left ) / NUM_BITS ) % data.length; 
                secondByteIndex = ( firstByteIndex + 1 ) % data.length; 
                
                scroll = ( left % NUM_BITS ); 
                firstByteFilter = data[ count ] >> scroll; 
                secondByteFilter = ( data[ count ] << ( NUM_BITS - scroll ) ) & BYTE_MASK; 
                
                data[ firstByteIndex  ] ^= firstByteFilter; 
                data[ secondByteIndex ] ^= secondByteFilter; 
                
                // Set the flag if any screen pixels are flipped from 1 to 0 ( 1 XOR 1 = 0 ). 
                dataWord = ( data[ firstByteIndex ] |  ( data[ secondByteIndex ] << NUM_BITS ) ); 
                filterWord = ( firstByteFilter | ( secondByteFilter << NUM_BITS ) ); 
                if( ( dataWord & filterWord ) != filterWord ) 
                    flag = true; 
            } 
            
            return flag; 
            
        } ); 
        
        // Clear display data. 
        this.clear = ( function(  ){ 
            
            var count = 0; 
            
            for( count = 0; count < data.length; count++ )
                data[ count ] = 0x0; 
            
            return true; 
            
        } ); 
        
        // Render the current data to the screen. 
        this.render = ( function(  ){ 
            
            return chip8StdOut.render( data ); 
            
        } ); 
        
        
        var data = new Uint8Array( DISPLAY_ARRAY_SIZE ); // 2048 bits. 
        var chip8StdOut = chip8StdOut; // Used to render the pixels on the screen. 
        
        
    } ); 
    
    // Central Processing Unit - Emulate the processor and the memory of chip8. 
    var CPU = ( function(  ){ 
        
        
        var memory = new Uint8Array( MEMORY_SIZE ); // RAM Memory with 4KB. 
        var registers = new Uint8Array( NUMBER_OF_REGISTERS ); // 16 registers. 
        var stack  = new Array( STACK_SIZE ); // 16 bits in each index. 
        var stackPoint = 0; // Address of stack level. 
        var delayTimer = 0; // Timer counter ( 60 Hz ). 
        var soundTimer = 0; // Sound timer counter ( 60 Hz ). 
        
        // Hexadecimal characters loaded into memory. 
        var CHARACTERS = [
            0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
            0x20, 0x60, 0x20, 0x20, 0x70, // 1
            0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
            0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
            0x90, 0x90, 0xF0, 0x10, 0x10, // 4
            0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
            0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
            0xF0, 0x10, 0x20, 0x40, 0x40, // 7
            0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
            0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
            0xF0, 0x90, 0xF0, 0x90, 0x90, // A
            0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
            0xF0, 0x80, 0x80, 0x80, 0xF0, // C
            0xE0, 0x90, 0x90, 0x90, 0xE0, // D
            0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
            0xF0, 0x80, 0xF0, 0x80, 0x80  // F
        ]; 
        
    } ); 
    
} ); 