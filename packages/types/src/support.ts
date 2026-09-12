export type SupportTicketStatus = "open" | "sent" | "failed";

export type SupportTicket = {
  id: string;
  organizationId: string;
  userId: string;
  subject: string;
  body: string;
  status: SupportTicketStatus;
  createdAt: string;
};
