# CryptoMarket

A modern cryptocurrency marketplace for buying and selling products with digital currencies like ETH, USDT, and BTC.

## Features

- **Cryptocurrency Payments**: Trade with ETH, USDT, BTC and other cryptocurrencies
- **Secure Authentication**: User registration and login with Supabase Auth
- **Product Listings**: Create detailed product listings with multiple images
- **Real-time Chat**: Direct messaging between buyers and sellers
- **Image Upload**: Secure image storage with Supabase Storage
- **Responsive Design**: Beautiful, mobile-first design with Tailwind CSS

## Supabase Storage Configuration

### Storage Bucket Setup

The application uses Supabase Storage for handling product images. The following configuration has been applied:

#### Bucket: `product-images`
- **Public Access**: Enabled for viewing images
- **File Size Limit**: 10MB per file
- **Allowed File Types**: JPG, JPEG, PNG, WebP, GIF
- **Organization**: Files are organized by user ID in folders

#### Storage RLS Policies

The following Row Level Security policies have been configured for the `storage.objects` table:

1. **Upload Policy**: `"Authenticated users can upload product images"`
   ```sql
   CREATE POLICY "Authenticated users can upload product images"
   ON storage.objects
   FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'product-images' AND
     auth.role() = 'authenticated'
   );
   ```

2. **Read Policy**: `"Public can view product images"`
   ```sql
   CREATE POLICY "Public can view product images"
   ON storage.objects
   FOR SELECT
   TO public
   USING (bucket_id = 'product-images');
   ```

3. **Update Policy**: `"Users can update own product images"`
   ```sql
   CREATE POLICY "Users can update own product images"
   ON storage.objects
   FOR UPDATE
   TO authenticated
   USING (
     bucket_id = 'product-images' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

4. **Delete Policy**: `"Users can delete own product images"`
   ```sql
   CREATE POLICY "Users can delete own product images"
   ON storage.objects
   FOR DELETE
   TO authenticated
   USING (
     bucket_id = 'product-images' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

### Image Upload Features

- **Authentication Required**: Only logged-in users can upload images
- **File Validation**: Automatic validation of file type and size
- **Error Handling**: Clear error messages for upload failures
- **Progress Indication**: Visual feedback during upload process
- **Drag & Drop**: Support for drag-and-drop file selection
- **Multiple Upload**: Batch upload of multiple images

### Security Features

- **User Isolation**: Users can only manage their own uploaded images
- **File Type Restrictions**: Only image files are allowed
- **Size Limits**: 10MB maximum file size to prevent abuse
- **Authentication Checks**: All uploads require valid user session

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env`
4. Run the development server: `npm run dev`

## Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Supabase (Database, Auth, Storage)
- **Icons**: Lucide React
- **Build Tool**: Vite