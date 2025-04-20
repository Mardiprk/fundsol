import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json({ success: false, message: 'Campaign ID is required' }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      id,
      message: 'Hello from the API!'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to process request', error: String(error) },
      { status: 500 }
    );
  }
} 