import * as https from 'https';
import * as crypto from 'crypto';
import * as querystring from 'querystring';

const MESSAGING_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
const SCOPES = [MESSAGING_SCOPE];

interface FCM_NotificationOptions {
  title: string;
  body: string;
}

interface FCM_MessageOptions {
  notification: FCM_NotificationOptions;
  /**
   * FCM device token
   */
  token?: string;
  topic?: string;
  data?: string;
  android?: object;
  apns?: object;
}

interface FCM_PayloadOptions {
  message: FCM_MessageOptions;
}

interface FCM_SendMessageOptions {
  access_token: string;
  project_id: string;
  payload_options: FCM_PayloadOptions;
}

interface AccessTokenOptions {
  client_email: string;
  private_key: string;
}

export const getAccessToken = async (
  token_options: AccessTokenOptions,
): Promise<string> => {
  const tokenUrl = 'https://oauth2.googleapis.com/token';

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: token_options.client_email,
    scope: SCOPES.join(' '),
    aud: tokenUrl,
    exp: now + 3600, // Token expires in 1 hour
    iat: now,
  };

  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');

  const signatureInput = `${base64Header}.${base64Payload}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureInput);

  const privateKey = token_options.private_key;
  const privateKeyAsBuffer = Buffer.from(privateKey, 'utf-8');

  const signature = signer.sign(privateKeyAsBuffer).toString('base64');

  const signedToken = `${signatureInput}.${signature}`;

  const postData = querystring.stringify({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: signedToken,
  });

  const options = {
    hostname: 'oauth2.googleapis.com',
    path: '/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': postData.length,
    },
    timeout: 15000,
  };

  return new Promise((resolve, reject) => {
    let is_end = false;
    const req = https.request(options, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        is_end = true;
        if (res.statusCode === 200) {
          const responseData = JSON.parse(data);
          if (responseData.access_token) {
            resolve(responseData.access_token);
          } else {
            reject(new Error('Access token not received from token endpoint'));
          }
        } else {
          reject(
            new Error(
              `Request failed with status code: ${
                res.statusCode
              } \n data: ${data.toString()}`,
            ),
          );
        }
      });
    });

    req.on('error', error => {
      if (is_end) return;
      reject(error);
    });

    req.write(postData);
    req.end();
  });
};

export const sendFcmMessage = async ({
  access_token,
  project_id,
  payload_options,
}: FCM_SendMessageOptions) => {
  const messagePayload = JSON.stringify(payload_options);

  const HOST = 'fcm.googleapis.com';
  const PATH = '/v1/projects/' + project_id + '/messages:send';

  const options = {
    hostname: HOST,
    path: PATH,
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + access_token,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(messagePayload),
    },
  };

  return new Promise((resolve, reject) => {
    let is_end = false;
    const req = https.request(options, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        is_end = true;
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(
            new Error(
              `Request failed with status code: ${
                res.statusCode
              } \n data: ${data.toString()}`,
            ),
          );
        }
      });
    });

    req.on('error', error => {
      if (is_end) return;
      reject(error);
    });

    req.write(messagePayload);
    req.end();
  });
};

module.exports = {
  getAccessToken,
  sendFcmMessage,
};
