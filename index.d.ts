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

declare type EventCallback = (payload: any, chat: Chat, data: any) => void;

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

declare class Chat {
  say(message: string | string[] | MessageType, options?: SendApiOptions): Promise<any>;

  sendTextMessage(text: string, quickReplies?: string[], options?: SendApiOptions): Promise<any>;

  sendButtonTemplate(text: string, buttons: Button[], options?: SendApiOptions): Promise<any>;

  sendGenericTemplate(elements: Element[], options?: SendApiOptions): Promise<any>;

  sendListTemplate(elements: Element[], buttons: Button[], options?: SendApiOptions): Promise<any>;

  sendTemplate(payload: any, options?: SendApiOptions): Promise<any>;

  sendAttachment(type: string, url: string, quickReplies?: string[], options?: SendApiOptions): Promise<any>;

  sendAction(action: Action, options?: SendApiOptions): Promise<any>;

  sendMessage(message: any, options?: SendApiOptions): Promise<any>;

  sendProfileRequest(body: any, method: string): Promise<any>;

  sendTypingIndicator(milliseconds: number): Promise<any>;

  getUserProfile(): Promise<UserProfile>;

  conversation(factory: (convo: Conversation) => void): Conversation;
}

declare type ConversationCallback = (payload: any, convo: Conversation, data: any) => void;

declare class Conversation extends Chat {
  ask(question: string | string[] | MessageType,
      answer: ConversationCallback,
      callbacks?: {
        event: string;
        callback: EventCallback;
      }[],
      options?: SendApiOptions): Conversation;

  set(property: string, value: any): void;

  get(property: string): any;

  isActive(): boolean;

  isWaitingForAnswer(): boolean;

  stopWaitingForAnswer(): void;

  end(): void;

  module(factory: (bot: BootBot) => void);

}

declare class BootBot {
  constructor(options: BootBotOptions);

  start(port: number = 3000): void;

  close(): void;

  on(event: EventType, callback: EventCallback): void;

  hear(keywords: string | RegExp | any[], callback: EventCallback): BootBot;

  say(userId: string, message: string | string[] | MessageType, options?: SendApiOptions): Promise<any>;

  sendTextMessage(userId: string, text: string, quickReplies?: string[], options?: SendApiOptions): Promise<any>;

  sendButtonTemplate(userId: string, text: string, buttons: Button[], options?: SendApiOptions): Promise<any>;

  sendGenericTemplate(userId: string, elements: Element[], options?: SendApiOptions): Promise<any>;

  sendListTemplate(userId: string, elements: Element[], buttons: Button[], options?: SendApiOptions): Promise<any>;

  sendTemplate(userId: string, payload: any, options?: SendApiOptions): Promise<any>;

  sendAttachment(userId: string, type: string, url: string, quickReplies?: string[], options?: SendApiOptions): Promise<any>;

  sendAction(userId: string, action: Action, options?: SendApiOptions): Promise<any>;

  sendMessage(userId: string, message: any, options?: SendApiOptions): Promise<any>;

  sendRequest(body: any, endpoint: string, method: string): Promise<any>;

  sendTypingIndicator(userId: string, milliseconds: number): Promise<any>;

  getUserProfile(userId: string): Promise<UserProfile>;

  conversation(userId: string, factory: (convo: Conversation) => void): Conversation;

  setGreetingText(text: string): Promise<any>;

  setGetStartedButton(action: string | Function): Promise<any>;

  deleteGetStartedButton(): Promise<any>;

  setPersistentMenu(buttons: string[] | any[], disableInput?: boolean = false): Promise<any>;

  deletePersistentMenu(): Promise<any>;

  handleFacebookData(data: any): void;
}

export = BootBot;