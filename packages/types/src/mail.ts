export type MailMessage = {
  to: string;
  subject: string;
  template: string;
  variables: Record<string, string>;
};
