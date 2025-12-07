# 🚀 Deployment Guide - Meta-Verse

This guide will help you deploy the Meta-Verse application to production.

## 📋 Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] MongoDB database set up (local or cloud)
- [ ] Frontend build tested locally
- [ ] Backend API tested
- [ ] All API keys obtained (Cloudinary, Agora, OpenAI, etc.)

## 🌐 Deployment Options

### Option 1: Deploy Backend + Frontend Together (Recommended for Small Projects)

This option serves the React app from the Express backend.

#### Steps:

1. **Build the Frontend**

```bash
cd client
npm install
npm run build
```

2. **Configure Backend for Production**

   - Set `NODE_ENV=production` in backend `.env`
   - Update `CLIENT_URL` to your production domain

3. **Deploy Backend**
   - Upload backend folder to your server
   - Install dependencies: `npm install --production`
   - Start server: `npm start`

#### Platforms:

- **Heroku**: Add `Procfile` with `web: node index.js`
- **Railway**: Set start command to `node index.js`
- **Render**: Set build command to `npm install && cd ../client && npm install && npm run build`
- **DigitalOcean App Platform**: Configure build and start commands

### Option 2: Deploy Separately (Recommended for Scalability)

#### Backend Deployment

**Platforms:**

- Heroku
- Railway
- Render
- DigitalOcean
- AWS EC2
- Google Cloud Run

**Steps:**

1. Set environment variables on your platform
2. Deploy backend code
3. Ensure MongoDB connection string is set
4. Test API endpoints

**Backend Environment Variables:**

```env
NODE_ENV=production
PORT=7071
CLIENT_URL=https://your-frontend-domain.com
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
# ... other API keys
```

#### Frontend Deployment

**Platforms:**

- Vercel (Recommended)
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Firebase Hosting

**Steps:**

1. Create `.env.production` file:

```env
VITE_API_URL=https://your-backend-domain.com
```

2. Build the project:

```bash
npm run build
```

3. Deploy the `dist` folder

**Vercel Deployment:**

```bash
npm install -g vercel
vercel
# Follow prompts
# Set VITE_API_URL as environment variable in Vercel dashboard
```

**Netlify Deployment:**

```bash
npm install -g netlify-cli
netlify deploy --prod
# Set VITE_API_URL in Netlify dashboard under Site settings > Environment variables
```

## 🔧 Platform-Specific Instructions

### Heroku

1. **Install Heroku CLI**

```bash
npm install -g heroku
```

2. **Login and Create App**

```bash
heroku login
heroku create your-app-name
```

3. **Set Environment Variables**

```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_jwt_secret
# ... add other variables
```

4. **Deploy**

```bash
git push heroku main
```

5. **Add Buildpack for Node.js** (if needed)

```bash
heroku buildpacks:set heroku/nodejs
```

### Railway

1. **Connect Repository**

   - Go to Railway dashboard
   - Click "New Project"
   - Select "Deploy from GitHub repo"

2. **Configure Environment Variables**

   - Add all required variables in Railway dashboard

3. **Set Start Command**

   - In settings, set start command: `node index.js`

4. **Deploy**
   - Railway automatically deploys on git push

### Vercel (Frontend)

1. **Install Vercel CLI**

```bash
npm install -g vercel
```

2. **Deploy**

```bash
cd client
vercel
```

3. **Set Environment Variables**

   - Go to Vercel dashboard
   - Project Settings > Environment Variables
   - Add `VITE_API_URL`

4. **Redeploy** (if you added env vars)

```bash
vercel --prod
```

### MongoDB Atlas (Cloud Database)

1. **Create Cluster**

   - Go to MongoDB Atlas
   - Create a free cluster

2. **Get Connection String**

   - Click "Connect"
   - Choose "Connect your application"
   - Copy connection string

3. **Update .env**

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/meta-verse?retryWrites=true&w=majority
```

4. **Whitelist IP Addresses**
   - In Atlas dashboard, add your server IP or `0.0.0.0/0` for all IPs

## 🔐 Security Checklist

- [ ] Use strong JWT_SECRET (random 32+ character string)
- [ ] Never commit `.env` files to git
- [ ] Use HTTPS in production
- [ ] Set secure CORS origins
- [ ] Enable MongoDB authentication
- [ ] Use environment variables for all secrets
- [ ] Regularly update dependencies
- [ ] Enable rate limiting (consider adding express-rate-limit)

## 📊 Monitoring & Maintenance

### Health Checks

- Monitor `/health` endpoint
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Monitor error logs

### Logging

- Use services like Loggly, Papertrail, or CloudWatch
- Monitor application logs regularly

### Database

- Regular backups
- Monitor database size
- Set up alerts for connection issues

## 🐛 Troubleshooting

### Common Issues

1. **Build Fails**

   - Check Node.js version (should be 16+)
   - Clear cache: `rm -rf node_modules package-lock.json`
   - Reinstall: `npm install`

2. **CORS Errors**

   - Verify `CLIENT_URL` matches frontend domain
   - Check CORS configuration in backend

3. **Database Connection Fails**

   - Verify MongoDB URI
   - Check IP whitelist in MongoDB Atlas
   - Verify credentials

4. **Static Files Not Loading**

   - Check build output path
   - Verify static file serving configuration
   - Check file permissions

5. **Environment Variables Not Working**
   - Verify variable names (case-sensitive)
   - Check platform-specific requirements
   - Restart server after adding variables

## 📈 Performance Optimization

1. **Enable Gzip Compression**

   - Add compression middleware in Express

2. **CDN for Static Assets**

   - Use Cloudflare or similar for static files

3. **Database Indexing**

   - Add indexes for frequently queried fields

4. **Image Optimization**

   - Use Cloudinary for image optimization
   - Implement lazy loading

5. **Caching**
   - Implement Redis for session storage
   - Cache API responses where appropriate

## 🔄 CI/CD Setup

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "18"
      - run: cd backend && npm install
      - run: cd client && npm install && npm run build
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: "your-app-name"
          heroku_email: "your-email@example.com"
```

## 📞 Support

If you encounter issues:

1. Check logs in your deployment platform
2. Verify environment variables
3. Test API endpoints with Postman/curl
4. Check MongoDB connection
5. Review error messages carefully

---

**Happy Deploying! 🚀**
