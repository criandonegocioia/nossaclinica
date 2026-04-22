import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsObject()
  @IsNotEmpty()
  content: Record<string, any>;

  @IsString()
  @IsNotEmpty()
  patientId: string;
}
