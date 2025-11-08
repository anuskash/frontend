import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { InboxComponent } from './inbox/inbox.component';
import { ConversationComponent } from './conversation/conversation.component';
import { MessageService } from './services/message.service';

@NgModule({
  declarations: [
    InboxComponent,
    ConversationComponent
  ],
  imports: [
    FormsModule,
    HttpClientModule
  ],
  providers: [
    MessageService
  ],
})
export class AppModule { }