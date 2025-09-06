import express from 'express';
import webpush from 'web-push';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Ensure env vars are loaded even if the main server loads them later
dotenv.config();

const router = express.Router();

// Basic request logger for notifications router
router.use((req, res, next) => {
  try {
    console.log(`[Notifications] ${req.method} ${req.originalUrl}`);
  } catch (_) {}
  next();
});

// VAPID keys configuration - make them optional
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

// Configure web-push only if VAPID keys are available
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@meta-verse.edu',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  console.log('✅ Push notifications configured successfully');
} else {
  console.log('⚠️  VAPID keys not found - push notifications will be disabled');
}

// In-memory storage for subscriptions and notifications
const subscriptions = new Map();
const notifications = new Map();

// POST /api/notifications/subscribe - Subscribe to push notifications
router.post('/subscribe', (req, res) => {
  try {
    console.log('[Notifications] /subscribe payload keys:', Object.keys(req.body || {}));
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return res.status(503).json({
        success: false,
        error: 'Push notifications are not configured'
      });
    }

    const { subscription, userId, userInfo } = req.body;
    try {
      console.log('[Notifications] subscribe userId:', userId);
      console.log('[Notifications] subscription endpoint:', subscription?.endpoint);
    } catch (_) {}
    
    if (!subscription || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Subscription and user ID are required'
      });
    }

    const subscriptionId = uuidv4();
    subscriptions.set(subscriptionId, {
      id: subscriptionId,
      userId,
      subscription,
      userInfo,
      createdAt: new Date(),
      isActive: true
    });

    res.json({
      success: true,
      subscriptionId,
      message: 'Successfully subscribed to push notifications'
    });
  } catch (error) {
    console.error('Subscribe error:', error && (error.stack || error.message || error));
    res.status(500).json({
      success: false,
      error: 'Failed to subscribe'
    });
  }
});

// POST /api/notifications/unsubscribe - Unsubscribe from push notifications
router.post('/unsubscribe', (req, res) => {
  try {
    console.log('[Notifications] /unsubscribe body:', req.body);
    const { subscriptionId } = req.body;
    
    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        error: 'Subscription ID is required'
      });
    }

    const subscription = subscriptions.get(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    subscription.isActive = false;
    subscriptions.delete(subscriptionId);

    res.json({
      success: true,
      message: 'Successfully unsubscribed from push notifications'
    });
  } catch (error) {
    console.error('Unsubscribe error:', error && (error.stack || error.message || error));
    res.status(500).json({
      success: false,
      error: 'Failed to unsubscribe'
    });
  }
});

// POST /api/notifications/send - Send notification to specific user
router.post('/send', async (req, res) => {
  try {
    console.log('[Notifications] /send body keys:', Object.keys(req.body || {}));
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return res.status(503).json({
        success: false,
        error: 'Push notifications are not configured'
      });
    }

    const { userId, title, body, icon, badge, data } = req.body;
    
    if (!userId || !title || !body) {
      return res.status(400).json({
        success: false,
        error: 'User ID, title, and body are required'
      });
    }

    // Find user's subscription
    let userSubscription = null;
    for (const [id, sub] of subscriptions) {
      if (sub.userId === userId && sub.isActive) {
        userSubscription = sub;
        break;
      }
    }

    if (!userSubscription) {
      return res.status(404).json({
        success: false,
        error: 'User subscription not found'
      });
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/icon-192x192.png',
      badge: badge || '/badge-72x72.png',
      data: data || {}
    });

    try {
      await webpush.sendNotification(userSubscription.subscription, payload);
      
      // Store notification
      const notificationId = uuidv4();
      notifications.set(notificationId, {
        id: notificationId,
        userId,
        title,
        body,
        icon,
        badge,
        data,
        sentAt: new Date(),
        status: 'sent'
      });

      res.json({
        success: true,
        notificationId,
        message: 'Notification sent successfully'
      });
    } catch (webpushError) {
      console.error('WebPush error:', webpushError);
      
      if (webpushError.statusCode === 410) {
        // Subscription expired, remove it
        subscriptions.delete(userSubscription.id);
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to send notification',
        details: webpushError.message
      });
    }
  } catch (error) {
    console.error('Send notification error:', error && (error.stack || error.message || error));
    res.status(500).json({
      success: false,
      error: 'Failed to send notification'
    });
  }
});

// POST /api/notifications/broadcast - Send notification to all subscribers
router.post('/broadcast', async (req, res) => {
  try {
    console.log('[Notifications] /broadcast body keys:', Object.keys(req.body || {}));
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return res.status(503).json({
        success: false,
        error: 'Push notifications are not configured'
      });
    }

    const { title, body, icon, badge, data } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({
        success: false,
        error: 'Title and body are required'
      });
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/icon-192x192.png',
      badge: badge || '/badge-72x72.png',
      data: data || {}
    });

    let successCount = 0;
    let failureCount = 0;
    const expiredSubscriptions = [];

    // Send to all active subscriptions
    for (const [id, subscription] of subscriptions) {
      if (!subscription.isActive) continue;
      
      try {
        await webpush.sendNotification(subscription.subscription, payload);
        successCount++;
        
        // Store notification
        const notificationId = uuidv4();
        notifications.set(notificationId, {
          id: notificationId,
          userId: subscription.userId,
          title,
          body,
          icon,
          badge,
          data,
          sentAt: new Date(),
          status: 'sent'
        });
      } catch (error) {
        failureCount++;
        if (error.statusCode === 410) {
          expiredSubscriptions.push(id);
        }
      }
    }

    // Remove expired subscriptions
    expiredSubscriptions.forEach(id => subscriptions.delete(id));

    res.json({
      success: true,
      message: 'Broadcast completed',
      stats: {
        totalSubscribers: subscriptions.size,
        successful: successCount,
        failed: failureCount,
        expiredRemoved: expiredSubscriptions.length
      }
    });
  } catch (error) {
    console.error('Broadcast error:', error && (error.stack || error.message || error));
    res.status(500).json({
      success: false,
      error: 'Failed to broadcast notification'
    });
  }
});

// POST /api/notifications/test - Send test notification
router.post('/test', async (req, res) => {
  try {
    console.log('[Notifications] /test body:', req.body);
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return res.status(503).json({
        success: false,
        error: 'Push notifications are not configured'
      });
    }

    const { subscriptionId } = req.body;
    
    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        error: 'Subscription ID is required'
      });
    }

    const subscription = subscriptions.get(subscriptionId);
    if (!subscription || !subscription.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Active subscription not found'
      });
    }

    const payload = JSON.stringify({
      title: 'Test Notification',
      body: 'This is a test notification from Meta-Verse!',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: { type: 'test' }
    });

    await webpush.sendNotification(subscription.subscription, payload);

    res.json({
      success: true,
      message: 'Test notification sent successfully'
    });
  } catch (error) {
    console.error('Test notification error:', error && (error.stack || error.message || error));
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification'
    });
  }
});

// GET /api/notifications/subscriptions - Get all subscriptions
router.get('/subscriptions', (req, res) => {
  try {
    const subscriptionsList = Array.from(subscriptions.values()).map(sub => ({
      id: sub.id,
      userId: sub.userId,
      userInfo: sub.userInfo,
      createdAt: sub.createdAt,
      isActive: sub.isActive
    }));

    res.json({
      success: true,
      count: subscriptionsList.length,
      subscriptions: subscriptionsList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get subscriptions'
    });
  }
});

// GET /api/notifications/user/:userId - Get user's notifications
router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const userNotifications = Array.from(notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

    res.json({
      success: true,
      count: userNotifications.length,
      notifications: userNotifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get user notifications'
    });
  }
});

// PUT /api/notifications/:notificationId/read - Mark notification as read
router.put('/:notificationId/read', (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = notifications.get(notificationId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    notification.status = 'read';
    notification.readAt = new Date();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

// GET /api/notifications/vapid-public-key - Get VAPID public key
router.get('/vapid-public-key', (req, res) => {
  console.log('[Notifications] /vapid-public-key requested. Public key present:', Boolean(VAPID_PUBLIC_KEY));
  if (!VAPID_PUBLIC_KEY) {
    return res.status(503).json({
      success: false,
      error: 'VAPID public key not configured'
    });
  }

  res.json({
    success: true,
    publicKey: VAPID_PUBLIC_KEY
  });
});

// GET /api/notifications/status - Report server-side notification configuration status
router.get('/status', (req, res) => {
  console.log('[Notifications] /status requested. Configured:', Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY), 'Subs:', subscriptions.size);
  res.json({
    success: true,
    configured: Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY),
    publicKeyPresent: Boolean(VAPID_PUBLIC_KEY),
    privateKeyPresent: Boolean(VAPID_PRIVATE_KEY),
    subscriptionsCount: subscriptions.size
  });
});

export default router;
