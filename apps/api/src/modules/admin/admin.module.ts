import { Module } from '@nestjs/common'
import { ManagerModule } from '../manager/manager.module'
import { AdminController } from './admin.controller'

@Module({
  imports: [ManagerModule],
  controllers: [AdminController],
})
export class AdminModule {}
