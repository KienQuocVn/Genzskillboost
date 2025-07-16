import AWS from "aws-sdk"

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
})

export async function uploadToS3(file: File, fileName: string): Promise<string> {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: fileName,
    Body: file,
    ContentType: file.type,
    ACL: "public-read",
  }

  try {
    const result = await s3.upload(params).promise()
    return result.Location
  } catch (error) {
    console.error("Error uploading to S3:", error)
    throw new Error("Failed to upload file")
  }
}

export async function deleteFromS3(fileName: string): Promise<void> {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: fileName,
  }

  try {
    await s3.deleteObject(params).promise()
  } catch (error) {
    console.error("Error deleting from S3:", error)
    throw new Error("Failed to delete file")
  }
}
