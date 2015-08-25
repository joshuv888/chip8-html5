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
var STACK_SIZE = 0x10; // 16 address ( two bytes for each address ). 
var STARTING_ADDRESS = 0x200; // Load ROM into RAM at address 512d ( 0x200 ). 
var CHARACTER_HEIGHT = 5; // 5 lines to draw a number into screen. 

var NUM_BITS = 0x08; // 8 bits in a byte. 
var BYTE_MASK = 0xFF; // 255 number as 8 bits mask. 


// Listener pattern
var Listenable = ( function(  ){ 
    
    
    // Add a listener. 
    this.addListener = ( function( listener ){ 
        
        listeners.push( listener ); 
        
    } ); 
    
    // Dispatch an event for all listeners. 
    this.notify = ( function( eventName ){ 
        
        var args = Array.prototype.slice.call( arguments, 1 ), count; 
        
        for( count = 0; count < listeners.length; count++ ) 
            if( typeof listeners[ count ][ eventName ] == 'function' ) 
                listeners[ count ][ eventName ].apply( null, args ); 
        
    } ); 
    
    
    var listeners = new Array(  ); // Listeners set. 
    
    
} ); 


// Chip8 emulator. 
var Chip8 = ( function( guiInterface ){ 
    
    
    // Stores and manages the display data. 
    var Display = ( function(  ){ 
        
        
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
        
        // Get data used to render the screen. 
        this.getData = ( function(  ){ 
            
            // JavaScript does not have a native read-only list interface ( and "splice" is slow to do this ). 
            return data; 
            
        } ); 
        
        
        var data = new Uint8Array( DISPLAY_ARRAY_SIZE ); // 2048 bits. 
        
        
    } ); 
    
    // Central Processing Unit - Emulate the processor and the memory of chip8. 
    var CPU = ( function( chip8Interface ){ 
        
        
        /*
            TODO: 
                "cycle" Emulate the cycle of CPU. 
                "load"  Load the ROM into memory. 
        */
        
        // Reset the CPU state and data. 
        this.reset = ( function(  ){ 
            
            var count = 0; 
            
            // Reset the memory RAM. 
            {
                // CHARACTERS FONT. 
                for( count = 0; count < CHARACTERS.length; count++ ) 
                    memory[ count ] = CHARACTERS[ count ]; 
                // Empty. 
                for( ; count < STARTING_ADDRESS; count++ ) 
                    memory[ count ] = 0; 
                // ROM. 
                var END_ROM_ADDRESS = STARTING_ADDRESS + romdata.length; // Calculate out of the loop. 
                for( ; count < END_ROM_ADDRESS; count++ ) 
                    memory[ count ] = romdata[ count ]; 
                // Empty. 
                for( ; count < memory.length; count++ ) 
                    memory[ count ] = 0; 
            }
            
            // Reset registers. 
            for( count = 0; count < NUMBER_OF_REGISTERS; count++ ) // register vector. 
                registers[ count ] = 0; 
            programCounter = STARTING_ADDRESS; 
            address = 0; 
            
            // Reset the stack and stack register. 
            stackPointer = 0; 
            for( count = 0; count < STACK_SIZE; count++ ) 
                stack[ count ] = 0; 
            
            // Reset timers. 
            delayTimer = 0; 
            soundTimer = 0; 
            
            
        } ); 
        
        
        var memory = new Uint8Array( MEMORY_SIZE ); // RAM Memory with 4KB. 
        var registers = new Uint8Array( NUMBER_OF_REGISTERS ); // 16 registers. 
        var stack  = new Array( STACK_SIZE ); // 16 bits in each index ( https://en.wikipedia.org/wiki/Call_stack ). 
        var stackPointer = 0; // Address of stack level ( https://en.wikipedia.org/wiki/Stack_register ). 
        var programCounter = 0; // Instruction counter ( https://en.wikipedia.org/wiki/Program_counter ). 
        var delayTimer = 0; // Timer counter ( 60 Hz ). 
        var soundTimer = 0; // Sound timer counter ( 60 Hz ). 
        var address = 0; // The address ( I ) register. 
        
        // Hexadecimal characters loaded into memory. 
        var CHARACTERS = [  
            0xF0, 0x90, 0x90, 0x90, 0xF0, // 0 #### ..#. #### #### #..# #### #### #### 
            0x20, 0x60, 0x20, 0x20, 0x70, // 1 #..# .##. ...# ...# #..# #... #... ...# 
            0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2 #..# ..#. #### #### #### #### #### ..#. 
            0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3 #..# ..#. #... ...# ...# ...# #..# .#.. 
            0x90, 0x90, 0xF0, 0x10, 0x10, // 4 #### .### #### #### ...# #### #### .#.. 
            0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5 
            0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6 #### #### #### ###. #### ###. #### #### 
            0xF0, 0x10, 0x20, 0x40, 0x40, // 7 #..# #..# #..# #..# #... #..# #... #... 
            0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8 #### #### #### ###. #... #..# #### #### 
            0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9 #..# ...# #..# #..# #... #..# #... #... 
            0xF0, 0x90, 0xF0, 0x90, 0x90, // A #### #### #..# ###. #### ###. #### #... 
            0xE0, 0x90, 0xE0, 0x90, 0xE0, // B 
            0xF0, 0x80, 0x80, 0x80, 0xF0, // C 
            0xE0, 0x90, 0x90, 0x90, 0xE0, // D 
            0xF0, 0x80, 0xF0, 0x80, 0xF0, // E 
            0xF0, 0x80, 0xF0, 0x80, 0x80  // F 
        ]; 
        
        // Current ROM loaded. 
        var romdata = [  ]; 
        
        var chip8Interface = chip8Interface; // Used as input and output. 
        
        
    } ); 
    
    // Private chip8 interface. 
    var chip8Interface = ( { 
        // TODO: waitKey, isKeyPressed. 
    } ); 
    
    
    // Frame loop of emulator. 
    var frame = ( function(  ){ 
        
        // TODO: 
        
    } ); 
    
    var guiInterface = guiInterface; // Graphical User Interface. 
    
    var listenable = new Listenable(  ); // Dispatch chip8 events for all listeners. 
    
    var display = new Display(  ); 
    var cpu = new CPU( chip8Interface ); // CPU of chip8. 
    var running = false; // True if game is running. 
    
    
} ); 