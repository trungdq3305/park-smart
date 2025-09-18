import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets'

@WebSocketGateway()
export class ParkingLotGateway {
  @SubscribeMessage('message')
  handleMessage(): string {
    return 'Hello world!'
  }
}
