declare interface BootBotOptions {
  accessToken: string;
  verifyToken: string;
  appSecret: string;
  broadcastEchoes?: boolean;
  webhook?: string;
}

declare type EventType =
  'message'
  | 'quick_reply'
  | 'attachment'
  | 'postback'
  | 'delivery'
  | 'read'
  | 'authentication'
  | 'referral'
  ;

declare type EventCallback = (payload: any, chat: SendApi, data: any) => void;

declare interface SendApiOptions {
  typing?: boolean;
  onDelivery: EventCallback;
  onRead: EventCallback;
}

declare interface QuickReplyMessage {
  text: string;
  quickReplies: string[];
}

declare interface Button {
  type: 'postback';
  title: string;
  payload: any;
}

declare interface ButtonMessage {
  text: string;
  buttons: Button[];
}

declare interface ListElement {
  title: string;
  image_url: string;
  default_action: any;
}

declare interface ListMessage {
  elements: ListElement[];
  buttons: Button[];
}

declare interface Card extends ListElement {

}

declare interface CardMessage {
  cards: Card[];
}

declare interface AttachmentMessage {
  attachment: string;
  url: string;
}


declare type MessageType =
  string
  | string[]
  | QuickReplyMessage
  | ButtonMessage
  | ListMessage
  | CardMessage
  | AttachmentMessage
  ;

declare type Action =
  'mark_seen'
  | 'typing_on'
  | 'typing_off'
  ;

declare interface UserProfile {
  first_name: string;
  last_name: string;
  profile_pic: string;
  locale: string;
  timezone: number;
  gender: string;
  last_ad_referral: {
    source: string;
    type: string;
    ad_id: string;
  }
}

declare class SendApi {
  say(message: string | string[] | MessageType, options?: SendApiOptions): void;

  sendTextMessage(text: string, quickReplies?: string[], options?: SendApiOptions): void;

  sendButtonTemplate(text: string, buttons: Button[], options?: SendApiOptions): void;

  sendGenericTemplate(elements: Element[], options?: SendApiOptions): void;

  sendListTemplate(elements: Element[], buttons: Button[], options?: SendApiOptions): void;

  sendTemplate(payload: any, options?: SendApiOptions): void;

  sendAttachment(type: string, url: string, quickReplies?: string[], options?: SendApiOptions): void;

  sendAction(action: Action, options?: SendApiOptions): void;

  sendMessage(message: any, options?: SendApiOptions): void;

  sendTypingIndicator(milliseconds: number): void;

  getUserProfile(): Promise<UserProfile>;

  conversation(factory: (convo: Conversation) => void);
}

declare type ConversationCallback = (payload: any, convo: Conversation, data: any) => void;

declare class Conversation extends SendApi {
  ask(question: string | string[] | MessageType,
      answer: ConversationCallback,
      callbacks?: {
        event: string;
        callback: EventCallback;
      }[],
      options?: SendApiOptions): void;

  set(property: string, value: any): void;

  get(property: string): any;

  end(): void;

  module(factory: (bot: BootBot) => void);

}


declare class BootBot {
  constructor(options: BootBotOptions);

  start(port: number = 3000): void;

  close(): void;

  on(event: EventType, callback: EventCallback): void;

  hear(keywords: string | RegExp | any[], callback: EventCallback): void;

  say(userId: string, message: string | string[] | MessageType, options?: SendApiOptions): void;

  sendTextMessage(userId: string, text: string, quickReplies?: string[], options?: SendApiOptions): void;

  sendButtonTemplate(userId: string, text: string, buttons: Button[], options?: SendApiOptions): void;

  sendGenericTemplate(userId: string, elements: Element[], options?: SendApiOptions): void;

  sendListTemplate(userId: string, elements: Element[], buttons: Button[], options?: SendApiOptions): void;

  sendTemplate(userId: string, payload: any, options?: SendApiOptions): void;

  sendAttachment(userId: string, type: string, url: string, quickReplies?: string[], options?: SendApiOptions): void;

  sendAction(userId: string, action: Action, options?: SendApiOptions): void;

  sendMessage(userId: string, message: any, options?: SendApiOptions): void;

  sendTypingIndicator(userId: string, milliseconds: number): void;

  getUserProfile(userId: string): Promise<UserProfile>;

  conversation(userId: string, factory: (convo: Conversation) => void);

  setGreetingText(text: string): void;

  setGetStartedButton(action: string | Function): void;

  deleteGetStartedButton(): void;

  setPersistentMenu(buttons: string[] | any[], disableInput?: boolean = false): void;

  deletePersistentMenu(): void;

  handleFacebookData(data: any): void;
}

export = BootBot;