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
var STACK_SIZE = 0x10; // 16 ( two bytes for each address ). 
var STARTING_ADDRESS = 0x200; // Load ROM into RAM at address 512d ( 0x200 ). 
var CHARACTER_HEIGHT = 5; // 5 lines to draw a number into screen. 

var BYTE_BITS = 0x08; // 8 bits in a byte. 
var BYTE_MASK = 0xFF; // 255 number as 8 bits mask. 
var R0x4_BITS = 0x04; // 4 bits in two hexadecimal digits. 
var R0x8_BITS = 0x08; // 8 bits in a hexadecimal digit. 
var R0xC_BITS = 0x0C; // 12 bits in a hexadecimal digit. 
var MASK_FL = 0xF00F; // First and Last. 
var MASK_FV = 0xF0FF; // First and Value. 
var MASK_V = 0x00FF; // Value mask. 
var MASK_A = 0x0FFF; // Address mask. 
var MASK_ALL = 0xFFFF; // All digits mask. 
var MASK_F = 0xF000; // Only first. 
var MASK_S = 0x0F00; // Only second. 
var MASK_T = 0x00F0; // Only third. 
var MASK_L = 0x000F; // Only last. 

// Make a word number. 
var byteToWord = ( function( highByte, lowerByte){ 
    
    return ( highByte << BYTE_BITS ) | ( lowerByte & BYTE_MASK ); 
    
} ); 

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
            var highByteIndex, lowerByteIndex, highByteFilter, lowerByteFilter, scroll; 
            var dataWord, filterWord; 
            var count; 
            
            for( count = 0; count < data.length; count++ ) // column height
            { 
                
                scroll = ( left % BYTE_BITS ); 
                
                highByteIndex = Math.floor( ( ( /* column height */ top + count ) * DISPLAY_WIDTH + left ) / BYTE_BITS ) % data.length; 
                highByteFilter = data[ count ] >> scroll; 
                data[ highByteIndex  ] ^= highByteFilter; 
                
                lowerByteFilter = ( data[ count ] << ( BYTE_BITS - scroll ) ) & BYTE_MASK; 
                lowerByteIndex = ( highByteIndex + 1 ) % data.length; 
                data[ lowerByteIndex ] ^= lowerByteFilter; 
                
                // Set the flag if any screen pixels are flipped from 1 to 0 ( 1 XOR 1 = 0 ). 
                dataWord = byteToWord( data[ highByteIndex ], data[ lowerByteIndex ] ); 
                filterWord = byteToWord( highByteFilter, lowerByteFilter ); 
                
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
            pc_register = STARTING_ADDRESS; // Starting in address 0x200. 
            i_register = 0; 
            
            // Reset the stack and stack register. 
            sp_register = 0; 
            for( count = 0; count < STACK_SIZE; count++ ) 
                stack[ count ] = 0; 
            
            // Reset timers. 
            delayTimer = 0; 
            soundTimer = 0; 
            
            
        } ); 
        
        // Emulate the cycle of CPU. 
        this.cycle = ( function(  ){ 
            
            var opcode = byteToWord( memory[ pc_register++ ], memory[ pc_register++ ] ); // Gets current instruction. 
            var f_op = ( opcode & MASK_F ) >> R0xC_BITS; // Gets first hexadecimal digit. 
            var x_op = ( opcode & MASK_S ) >> R0x8_BITS; // Gets second hexadecimal digit. 
            var y_op = ( opcode & MASK_T ) >> R0x4_BITS; // Gets third hexadecimal digit. 
            var value_op = ( opcode & MASK_V ); // Gets lower byte of "opcode". 
            var address_op = ( opcode & MASK_A ); // Get a 12-bit value used as the memory address. 
            
            var target, result, operator, value_one, value_two; // Used to run the instruction. 
            var instruction; // Instruction identifier. 
            
            // var base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'; // Base 64 decode. 
            
            instruction = FIRST_FILTER[ f_op ][ opcode & FIRST_FILTER[ f_op ][ 'MASK' ] ]; 
            
            
        } ); 
        
        // Load the ROM into memory. 
        this.load = ( function( data ){ 
            
            romdata = data.slice(  ); // "slice" used to copy the array. 
            
        } ); 
        
        
        var memory = new Uint8Array( MEMORY_SIZE ); // RAM Memory with 4KB. 
        var registers = new Uint8Array( NUMBER_OF_REGISTERS ); // 16 registers. 
        var stack  = new Array( STACK_SIZE ); // 16 bits in each index ( https://en.wikipedia.org/wiki/Call_stack ). 
        var sp_register = 0; // Address of stack level ( https://en.wikipedia.org/wiki/Stack_register ). 
        var pc_register = 0; // Instruction counter ( https://en.wikipedia.org/wiki/Program_counter ). 
        var i_register = 0; // The I register. 
        var delayTimer = 0; // Timer counter ( 60 Hz ). 
        var soundTimer = 0; // Sound timer counter ( 60 Hz ). 
        
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
        
        // Instruction identifiers. 
        var N___ = ( { 'MASK': MASK_F } ); 
        var N__N = ( { 'MASK': MASK_FL } ); 
        var N_NN = ( { 'MASK': MASK_FV } ); 
        var NNNN = ( { 'MASK': MASK_ALL } ); 
        
        NNNN[ 0x00E0 ] = 0x00; // 00E0    Clears the screen. 
        NNNN[ 0x00EE ] = 0x01; // 00EE    Returns from a subroutine. 
        N___[ 0x1000 ] = 0x02; // 1NNN    Jumps to address NNN. 
        N___[ 0x2000 ] = 0x03; // 2NNN    Calls subroutine at NNN. 
        N___[ 0x3000 ] = 0x04; // 3XNN    Skips the next instruction if VX equals NN. 
        N___[ 0x4000 ] = 0x05; // 4XNN    Skips the next instruction if VX doesn't equal NN. 
        N__N[ 0x5000 ] = 0x06; // 5XY0    Skips the next instruction if VX equals VY. 
        N___[ 0x6000 ] = 0x07; // 6XNN    Sets VX to NN. 
        N___[ 0x7000 ] = 0x08; // 7XNN    Adds NN to VX. 
        N__N[ 0x8000 ] = 0x09; // 8XY0    Sets VX to the value of VY. 
        N__N[ 0x8001 ] = 0x0A; // 8XY1    Sets VX to VX or VY. 
        N__N[ 0x8002 ] = 0x0B; // 8XY2    Sets VX to VX and VY. 
        N__N[ 0x8003 ] = 0x0C; // 8XY3    Sets VX to VX xor VY. 
        N__N[ 0x8004 ] = 0x0D; // 8XY4    Adds VY to VX. VF is set to 1 when there's a carry, and to 0 when there isn't. 
        N__N[ 0x8005 ] = 0x0E; // 8XY5    VY is subtracted from VX. VF is set to 0 when there's a borrow, and 1 when there isn't. 
        N__N[ 0x8006 ] = 0x0F; // 8XY6    Shifts VX right by one. VF is set to the value of the least significant bit of VX before the shift. 
        N__N[ 0x8007 ] = 0x10; // 8XY7    Sets VX to VY minus VX. VF is set to 0 when there's a borrow, and 1 when there isn't. 
        N__N[ 0x800E ] = 0x11; // 8XYE    Shifts VX left by one. VF is set to the value of the most significant bit of VX before the shift. 
        N__N[ 0x9000 ] = 0x12; // 9XY0    Skips the next instruction if VX doesn't equal VY. 
        N___[ 0xA000 ] = 0x13; // ANNN    Sets I to the address NNN. 
        N___[ 0xB000 ] = 0x14; // BNNN    Jumps to the address NNN plus V0. 
        N___[ 0xC000 ] = 0x15; // CXNN    Sets VX to the result of a bitwise and operation on a random number and NN. 
        N___[ 0xD000 ] = 0x16; // DXYN    Sprites stored in memory at location in index register (I), 8bits wide. Wraps around the screen. If when drawn, clears a pixel, register VF is set to 1 otherwise it is zero. All drawing is XOR drawing (i.e. it toggles the screen pixels). Sprites are drawn starting at position VX, VY. N is the number of 8bit rows that need to be drawn. If N is greater than 1, second line continues at position VX, VY+1, and so on. 
        N_NN[ 0xE09E ] = 0x17; // EX9E    Skips the next instruction if the key stored in VX is pressed. 
        N_NN[ 0xE0A1 ] = 0x18; // EXA1    Skips the next instruction if the key stored in VX isn't pressed. 
        N_NN[ 0xF007 ] = 0x19; // FX07    Sets VX to the value of the delay timer. 
        N_NN[ 0xF00A ] = 0x1A; // FX0A    A key press is awaited, and then stored in VX. 
        N_NN[ 0xF015 ] = 0x1B; // FX15    Sets the delay timer to VX. 
        N_NN[ 0xF018 ] = 0x1C; // FX18    Sets the sound timer to VX. 
        N_NN[ 0xF01E ] = 0x1D; // FX1E    Adds VX to I. 
        N_NN[ 0xF029 ] = 0x1E; // FX29    Sets I to the location of the sprite for the character in VX. Characters 0-F (in hexadecimal) are represented by a 4x5 font. 
        N_NN[ 0xF033 ] = 0x1F; // FX33    Stores the Binary-coded decimal representation of VX, with the most significant of three digits at the address in I, the middle digit at I plus 1, and the least significant digit at I plus 2. (In other words, take the decimal representation of VX, place the hundreds digit in memory at location in I, the tens digit at location I+1, and the ones digit at location I+2.) 
        N_NN[ 0xF055 ] = 0x20; // FX55    Stores V0 to VX in memory starting at address I. 
        N_NN[ 0xF065 ] = 0x21; // FX65    Fills V0 to VX with values from memory starting at address I. 
        
        var FIRST_FILTER = [ 
            NNNN, // 0x0 
            N___, // 0x1 
            N___, // 0x2 
            N___, // 0x3 
            N___, // 0x4 
            N__N, // 0x5 
            N___, // 0x6 
            N___, // 0x7  
            N__N, // 0x8 
            N__N, // 0x9 
            N___, // 0xA 
            N___, // 0xB 
            N___, // 0xC 
            N___, // 0xD 
            N_NN, // 0xE 
            N_NN  // 0xF 
        ]; 
        
        // Current ROM loaded. 
        var romdata = [  ]; 
        
        var chip8Interface = chip8Interface; // Used as input and output. 
        
        
    } ); 
    
    // Private chip8 interface. 
    var chip8Interface = ( { 
        // TODO: waitKey, isKeyPressed, setDrawFlag. 
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