export interface GetContactsDto {
    page?: number;
    limit?: number;
    tag?: string;
    minCallCount?: number;
    firstSeenFrom?: string;
    firstSeenTo?: string;
  }