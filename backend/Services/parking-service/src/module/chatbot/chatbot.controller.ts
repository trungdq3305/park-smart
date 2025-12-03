import { BadRequestException, Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger'; 
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, ValidateNested, IsArray } from 'class-validator'; // Thêm IsArray

import { ApiResponseDto } from 'src/common/dto/apiResponse.dto';
import { ChatHistoryItemDto } from './chat-history.dto';
import { ChatbotService } from './chatbot.service';

// DTO đơn giản cho request
export class ChatRequestDto {
    @ApiProperty({ example: 'Tôi bị trừ điểm Uy Tín sai, tôi phải làm gì?', description: 'Câu hỏi mới nhất của người dùng.' })
    @IsNotEmpty({ message: 'Trường newMessage không được để trống.' })
    @IsString({ message: 'newMessage phải là chuỗi văn bản.' })
    newMessage: string;

    @ApiProperty({ type: () => ChatHistoryItemDto, isArray: true, required: false, description: 'Lịch sử chat dùng để duy trì ngữ cảnh. Gửi [] nếu là tin nhắn đầu tiên.' })
    @IsOptional()
    @IsArray({ message: 'history phải là một mảng.' })
    @ValidateNested({ each: true })
    @Type(() => ChatHistoryItemDto)
    history?: ChatHistoryItemDto[]; // Sử dụng history? để đảm bảo nó là tùy chọn
}

// DTO đơn giản cho response
export class ChatResponseData {
    @ApiProperty({ example: 'Vui lòng tạo Báo cáo Sự cố (Report) trong ứng dụng...' })
    answer: string;
}

@ApiTags('chatbot')
@Controller('chatbot')
export class ChatbotController {
    constructor(private readonly chatbotService: ChatbotService) {}

    @Post('chat')
    @ApiOperation({ summary: 'Gửi câu hỏi đến Trợ lý Hướng dẫn Chatbot' })
    @ApiResponse({
        status: HttpStatus.OK,
        type: ApiResponseDto<ChatResponseData>,
        description: 'Phản hồi từ Chatbot.'
    })
    async chat(
        @Body() chatRequestDto: ChatRequestDto,
    ): Promise<ApiResponseDto<ChatResponseData>> {
        
        // --- BƯỚC SỬA LỖI 1: KIỂM TRA TIN NHẮN MỚI ---
        // Logic này vẫn cần để đảm bảo không gửi chuỗi rỗng đến Gemini
        if (!chatRequestDto.newMessage || chatRequestDto.newMessage.trim() === '') {
            throw new BadRequestException('Vui lòng nhập câu hỏi để trò chuyện với Trợ lý Hướng dẫn.');
        }

        // 1. Lấy lịch sử cũ (sẽ là [] hoặc undefined, dùng || [] để đảm bảo là mảng)
        const history = chatRequestDto.history || [];

        // 2. Thêm tin nhắn mới nhất vào lịch sử
        // Đã đảm bảo rằng chatRequestDto.newMessage không rỗng ở bước trên
        history.push({ text: chatRequestDto.newMessage, sender: 'user' });

        // 3. Gọi service để nhận phản hồi từ Gemini
        const botAnswer = await this.chatbotService.getChatResponse(history);

        // 4. Trả về câu trả lời
        return {
            data: [{ answer: botAnswer }],
            message: 'Phản hồi thành công',
            statusCode: HttpStatus.OK,
            success: true,
        };
    }
}
