- [Query language blocks:](#query-language-blocks)
- [Authentication Flow](#authentication-flow)
- [Inbox/Outbox service](#inboxoutbox-service)
- [Parser \& Reminder service](#parser--reminder-service)
- [Web Interface](#web-interface)


### Query language blocks:
- [ ] Decide on Style
  1. Datalog?
  2. Markdown language blocks:


### Authentication Flow
1. [ ] Option 1
   - One user can register group chat
   member of group chat
   - They are provided with a confirmation token for each user in the group
   - Each user must message confirmation token
   - If their user/number hasn't been registered for the chat, they
   - Example flows:
     - A - all join mms
       - User A adds phone number to group chat
       - Kibitz posts N auth codes - 1 for each member of group chat
       - Each member  

### Inbox/Outbox service
- [ ] Services to support
 1. Text
 2. Email
 3. Whatsapp
   - [ ] (+ voice notes?)
 4. [ ] Discord
   - [ ] (+ voice notes?)
- [ ] Recieving
  - [ ] Http server for webhooks?
  - [ ] what other integrations?
  - [ ] Calls to parser
- [ ] Sending
  - [ ] Queue that gets polled?
  - [ ] DB triggers?


### Parser & Reminder service
- Temporal worker?

### Web Interface
- Register
- Oauth etc