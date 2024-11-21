const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(bodyParser.text({ type: 'application/xml' }));

const CONVERGE_URL =
  process.env.CONVERGE_URL || 'https://api.demo.convergepay.com/VirtualMerchantDemo/processxml.do';

app.post('/api/process-payment', async (req, res) => {
  try {
    // Log raw XML for debugging
    console.log('Original Raw XML Body:', req.body);

    // Inject merchant credentials into the XML
    const updatedXml = req.body.replace(
      '</txn>',
      `
        <ssl_merchant_id>${process.env.MERCHANT_ID}</ssl_merchant_id>
        <ssl_user_id>${process.env.USER_ID}</ssl_user_id>
        <ssl_pin>${process.env.PIN}</ssl_pin>
      </txn>`
    );

    console.log('Updated XML with Credentials:', updatedXml);

    // Make the request to Converge with updated XML
    const convergeResponse = await axios.post(
      CONVERGE_URL,
      new URLSearchParams({ xmldata: updatedXml }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    // Send back the response from Converge
    res.type('application/xml').send(convergeResponse.data);
  } catch (error) {
    console.error('Error:', error.message);

    // Send an XML-formatted error message
    res.status(500).type('application/xml').send(`
      <txn>
        <error>
          <message>${error.message}</message>
        </error>
      </txn>
    `);
  }
});

module.exports = app;
