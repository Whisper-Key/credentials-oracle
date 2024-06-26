import { MessageDestination } from "./MessageDestination.js";
import { NotificationChannel } from "./NotificationChannel.js";

export class WhatsAppChannel extends NotificationChannel {
    constructor(channel: string) {
        super(channel);
    }

    sendMessage(destination: MessageDestination, message: string): void {
        const source = process.env.WHATSAPP_NUMBER;
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const client = require('twilio')(accountSid, authToken);

        if (!destination || !message) {
            return;
        }

        client.messages
            .create({
                body: message,
                from: `whatsapp:${source}`,
                to: `whatsapp:${destination.phone}`
            })
            .then((message: { sid: any; }) => console.log(message.sid));
    }
}