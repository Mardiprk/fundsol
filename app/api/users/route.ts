import { NextRequest, NextResponse } from 'next/server';
import { db, verifyDatabase } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { userCreationSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    await verifyDatabase(); // Ensure database is ready
    const body = await request.json();
    
    // Validate request body using Zod schema
    const validationResult = userCreationSchema.safeParse(body);

    if (!validationResult.success) {
      // Log the detailed validation errors to the server console
      console.error("User validation error:", validationResult.error.flatten().fieldErrors);
      
      return NextResponse.json({
        success: false,
        message: "Invalid user data. Please check your inputs and try again."
        // Optionally, include an error code for client-side handling:
        // error_code: "VALIDATION_ERROR" 
      }, { status: 400 });
    }

    // Use validated data
    const { wallet_address } = validationResult.data;

    // Check if user already exists
    const existingUser = await db.execute({
      sql: 'SELECT id FROM users WHERE wallet_address = ?',
      args: [wallet_address]
    });

    const now = new Date().toISOString();

    if (existingUser.rows.length > 0) {
      // Update the user's last updated time
      await db.execute({
        sql: 'UPDATE users SET updated_at = ? WHERE wallet_address = ?',
        args: [now, wallet_address]
      });

      return NextResponse.json({
        success: true,
        message: 'User updated successfully',
        user: {
          id: existingUser.rows[0].id,
          wallet_address
        }
      });
    } else {
      // Create a new user
      const userId = uuidv4();

      await db.execute({
        sql: 'INSERT INTO users (id, wallet_address, created_at, updated_at) VALUES (?, ?, ?, ?)',
        args: [userId, wallet_address, now, now]
      });

      return NextResponse.json({
        success: true,
        message: 'User created successfully',
        user: {
          id: userId,
          wallet_address
        }
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating/updating user:', error); // Log the full error object
    
    // For any unexpected errors, return a generic message
    return NextResponse.json({
      success: false,
      message: 'Failed to process user request due to an internal error.'
      // error_code: "INTERNAL_SERVER_ERROR"
    }, { status: 500 });
  }
}