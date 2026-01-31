import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

export async function GET() {
  try {
    // Check environment variables
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    const envCheck = {
      CLOUDINARY_CLOUD_NAME: cloudName ? `Set (${cloudName})` : 'NOT SET!',
      CLOUDINARY_API_KEY: apiKey ? `Set (${apiKey.substring(0, 4)}...)` : 'NOT SET!',
      CLOUDINARY_API_SECRET: apiSecret ? `Set (${apiSecret.substring(0, 4)}...)` : 'NOT SET!',
    }

    // Configure cloudinary
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    })

    // Try to ping Cloudinary
    let pingResult = 'Not tested'
    try {
      const result = await cloudinary.api.ping()
      pingResult = result.status === 'ok' ? 'OK - Connected!' : `Status: ${result.status}`
    } catch (pingError: any) {
      pingResult = `Error: ${pingError.message}`
    }

    return NextResponse.json({
      success: true,
      envVariables: envCheck,
      cloudinaryPing: pingResult,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}
