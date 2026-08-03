import { Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import {
  type AvailableNumberDto,
  type PhoneNumberDto,
  PurchaseNumberInput,
  SearchNumbersQuery,
  UpdateNumberInput,
} from '@fit-ai/contracts';
import { NumbersService } from './numbers.service';
import { Roles } from '../auth/guards';
import { ZodBody, ZodQuery } from '../shared/zod.pipe';

@Controller('numbers')
export class NumbersController {
  constructor(private readonly numbers: NumbersService) {}

  @Get()
  list(): Promise<PhoneNumberDto[]> {
    return this.numbers.list();
  }

  /** Catalogue of purchasable virtual numbers (mocked — see NOT-IMPLEMENTED.md). */
  @Roles('ADMIN', 'SUPERVISOR')
  @Get('available')
  available(@ZodQuery(SearchNumbersQuery) query: SearchNumbersQuery): Promise<AvailableNumberDto[]> {
    return this.numbers.search(query);
  }

  /** The SIM-replacement business case, using the client's own headcount. */
  @Roles('ADMIN', 'SUPERVISOR')
  @Get('roaming-estimate')
  roaming() {
    return this.numbers.roamingSavingEstimate();
  }

  @Roles('ADMIN')
  @Post()
  @HttpCode(201)
  purchase(@ZodBody(PurchaseNumberInput) body: PurchaseNumberInput): Promise<PhoneNumberDto> {
    return this.numbers.purchase(body);
  }

  @Roles('ADMIN', 'SUPERVISOR')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @ZodBody(UpdateNumberInput) body: UpdateNumberInput,
  ): Promise<PhoneNumberDto> {
    return this.numbers.update(id, body);
  }

  @Roles('ADMIN')
  @Delete(':id')
  @HttpCode(204)
  release(@Param('id') id: string): Promise<void> {
    return this.numbers.release(id);
  }
}
