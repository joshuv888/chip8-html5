/* 
 * Author: Maxwell Aguiar Silva
 * E-mail: maxwellaguiarsilva@gmail.com
 * A Chip8 emulator written in javascript. 
 * 
*/

// Chip8 constants. 
var DISPLAY_WIDTH = 0x40; // 64 pixels. 
var DISPLAY_HEIGHT = 0x20; // 32 pixels. 
var DISPLAY_ARRAY_SIZE = 0x0100; // 2048 bits. 
var NUM_BITS = 0x08; // 8 bits in a byte. 
var BYTE_MASK = 0xFF; // 255 number as 8 bits mask. 


// Chip8 emulator. 
var Chip8 = ( function(  ){ 
    
    
    // Stores and manages the display data. 
    var Display = ( function(  ){ 
        
        
        // Draw column data with the XOR operator. 
        this.draw = ( function( data, left, top ){ 
            
            var flag = false; 
            var count; 
            
            for( count = 0; count < data.length; count++ ) // column height
            { 
                var byteOneIndex = Math.floor( ( ( /* column height */ top + count ) * DISPLAY_WIDTH + left ) / NUM_BITS ) % data.length; 
                var byteTwoIndex = ( byteOneIndex + 1 ) % data.length; 
                
                var scroll = ( left % NUM_BITS ); 
                var byteOneFilter = data[ count ] >> scroll; 
                var byteTwoFilter = ( data[ count ] << ( NUM_BITS - scroll ) ) & BYTE_MASK; 
                
                data[ byteOneIndex ] ^= byteOneFilter; 
                data[ byteTwoIndex ] ^= byteTwoFilter; 
                
                // Set the flag if any screen pixels are flipped from 1 to 0 ( 1 XOR 1 = 0 ). 
                if( (
                        ( data[ byteOneIndex ] |  ( data[ byteTwoIndex ] << NUM_BITS ) ) & 
                        ( byteOneFilter | ( byteTwoFilter << NUM_BITS ) ) 
                    ) != 
                    ( byteOneFilter | ( byteTwoFilter << NUM_BITS ) ) 
                ) 
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
        
        // TODO: Render method, using userInterface. 
        
        
        var data = new Uint8Array( DISPLAY_ARRAY_SIZE ); // 2048 bits. 
        
        
    } ); 
    
    
    
} ); 