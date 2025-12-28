// Formspree notification service
// Replace YOUR_FORMSPREE_ID with your actual Formspree form ID
// Get your form ID from https://formspree.io/

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mjgvodgp';

interface NotificationData {
  type: 'claim' | 'new_item';
  itemName: string;
  itemCategory: string;
  itemLocation: string;
  userEmail?: string;
  userPhone?: string;
  userName?: string;
  description?: string;
  timestamp: string;
}

export async function sendNotification(data: NotificationData): Promise<boolean> {
  try {
    const subject = data.type === 'claim' 
      ? `🔔 Item Claimed: ${data.itemName}`
      : `📦 New Item Listed: ${data.itemName}`;

    const message = data.type === 'claim'
      ? `
Someone has claimed an item on Campus Connect!

📦 Item Details:
- Name: ${data.itemName}
- Category: ${data.itemCategory}
- Location: ${data.itemLocation}

👤 Claimant Details:
- Name: ${data.userName || 'Not provided'}
- Email: ${data.userEmail || 'Not provided'}
- Phone: ${data.userPhone || 'Not provided'}
- Description: ${data.description || 'Not provided'}

⏰ Claimed at: ${data.timestamp}
      `.trim()
      : `
A new item has been listed on Campus Connect!

📦 Item Details:
- Name: ${data.itemName}
- Category: ${data.itemCategory}
- Location: ${data.itemLocation}
- Description: ${data.description || 'Not provided'}

👤 Reporter Details:
- Email: ${data.userEmail || 'Not provided'}
- Phone: ${data.userPhone || 'Not provided'}

⏰ Listed at: ${data.timestamp}
      `.trim();

    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        _subject: subject,
        message: message,
        type: data.type,
        itemName: data.itemName,
        itemCategory: data.itemCategory,
        itemLocation: data.itemLocation,
        userEmail: data.userEmail,
        userPhone: data.userPhone,
        userName: data.userName,
        timestamp: data.timestamp,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send notification:', error);
    return false;
  }
}

// For Telegram notifications, you can set up a Formspree webhook
// or use a Telegram bot directly. Here's a helper for direct Telegram:

const TELEGRAM_BOT_TOKEN = '8540642039:AAGVj4MfZh1kD29auL2Idv_suBo09hCEI-4';
const TELEGRAM_CHAT_ID = '7469646534';

export async function sendTelegramNotification(data: NotificationData): Promise<boolean> {
  // Skip if tokens not configured
  if (TELEGRAM_BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN') {
    console.log('Telegram not configured, skipping...');
    return false;
  }

  try {
    const emoji = data.type === 'claim' ? '🔔' : '📦';
    const action = data.type === 'claim' ? 'CLAIMED' : 'LISTED';
    
    const text = `
${emoji} *Item ${action}*

*Item:* ${data.itemName}
*Category:* ${data.itemCategory}
*Location:* ${data.itemLocation}

*Contact:*
${data.userName ? `• Name: ${data.userName}` : ''}
${data.userEmail ? `• Email: ${data.userEmail}` : ''}
${data.userPhone ? `• Phone: ${data.userPhone}` : ''}

⏰ ${data.timestamp}
    `.trim();

    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: text,
          parse_mode: 'Markdown',
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
    return false;
  }
}

// Combined notification sender
// Email: Only for claims
// Telegram: For all notifications (claims + new items)
export async function notifyAll(data: NotificationData): Promise<void> {
  const promises: Promise<boolean>[] = [
    // Telegram gets all notifications
    sendTelegramNotification(data),
  ];
  
  // Email only for claims
  if (data.type === 'claim') {
    promises.push(sendNotification(data));
  }
  
  await Promise.all(promises);
}
