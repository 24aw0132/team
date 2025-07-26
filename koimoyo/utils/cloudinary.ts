export default async function uploadToCloudinary(uri: string): Promise<string | null> {
  try {
    console.log('Starting upload for URI:', uri);

    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: 'upload.jpg',
    } as any);
    formData.append('upload_preset', 'koimoyo'); // unsigned preset 名称

    const response = await fetch('https://api.cloudinary.com/v1_1/dzngojq7y/image/upload', {
      method: 'POST',
      body: formData,
      // ❌ 注意：不要添加 headers，fetch 会自动设置 multipart 边界
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed with status:', response.status, errorText);
      return null;
    }

    const result = await response.json();
    console.log('Cloudinary response:', result);

    return result.secure_url || null;
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
}
