import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit {
  private producer: Producer;

  async onModuleInit() {
    const kafka = new Kafka({ brokers: ['localhost:9092'] });
    this.producer = kafka.producer();
    await this.producer.connect();
  }

  async send(topic: string, message: any) {
    await this.producer.send({
      topic,
      messages: [{ key: message.key, value: JSON.stringify(message.value) }],
    });
  }
}
