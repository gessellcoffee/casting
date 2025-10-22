# Test Setup Guide

## Installing Test Dependencies

To run the security tests, you need to install Jest and related dependencies:

```bash
npm install --save-dev jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom
```

## Jest Configuration

Create a `jest.config.js` file in the project root:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
};
```

## Update package.json

Add the test script to your `package.json`:

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build --turbopack",
    "start": "next start",
    "lint": "eslint",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run specific test file
```bash
npm test -- profile.test.ts
npm test -- storage.test.ts
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Files Created

1. **`src/lib/supabase/__tests__/profile.test.ts`**
   - Tests profile update authorization
   - Verifies users can only update their own profiles
   - Tests authentication error handling

2. **`src/lib/supabase/__tests__/storage.test.ts`**
   - Tests file upload authorization
   - Verifies users can only upload to their own folders
   - Tests all three upload functions (photo, resume, gallery)

## Manual Testing

If you prefer to test manually without installing Jest:

### Test 1: Verify Own Profile Update Works
1. Login to the application
2. Navigate to `/profile`
3. Click "Edit Profile"
4. Make changes and save
5. ✅ Should succeed

### Test 2: Attempt to Update Another User's Profile
1. Open browser console (F12)
2. Get your user ID: `const user = await getUser(); console.log(user.id);`
3. Try to update a different user ID:
   ```javascript
   import { updateProfile } from '@/lib/supabase/profile';
   
   // Replace with a different user ID
   const result = await updateProfile('different-user-id', {
     first_name: 'Hacked'
   });
   
   console.log(result);
   ```
4. ✅ Should return error: "Unauthorized: You can only update your own profile"

### Test 3: Verify File Upload Authorization
1. Open browser console
2. Try to upload to another user's folder:
   ```javascript
   import { uploadProfilePhoto } from '@/lib/supabase/storage';
   
   const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
   const result = await uploadProfilePhoto('different-user-id', file);
   
   console.log(result);
   ```
3. ✅ Should return error: "Unauthorized: You can only upload files to your own profile"

## Expected Test Results

All tests should pass with the security fixes in place:

```
PASS  src/lib/supabase/__tests__/profile.test.ts
  Profile Security Tests
    updateProfile
      ✓ should allow users to update their own profile
      ✓ should prevent users from updating other users profiles
      ✓ should reject unauthenticated requests
      ✓ should handle authentication errors gracefully

PASS  src/lib/supabase/__tests__/storage.test.ts
  Storage Security Tests
    uploadProfilePhoto
      ✓ should allow users to upload to their own profile folder
      ✓ should prevent users from uploading to other users folders
      ✓ should reject unauthenticated upload requests
    uploadResume
      ✓ should allow users to upload resume to their own folder
      ✓ should prevent users from uploading resume to other users folders
    uploadGalleryImage
      ✓ should allow users to upload gallery images to their own folder
      ✓ should prevent users from uploading gallery images to other users folders

Test Suites: 2 passed, 2 total
Tests:       11 passed, 11 total
```

## Troubleshooting

### Module resolution errors
If you get errors about module resolution, ensure your `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Supabase client errors
The tests mock the Supabase client, so you don't need actual Supabase credentials to run them.

### TypeScript errors
Ensure you have `@types/jest` installed:
```bash
npm install --save-dev @types/jest
```
