export class TranscriptService {

    private readonly samples: string[] = [
      "Hi, this is Ramesh from Vijayawada. I wanted to know the rent for your 2BHK property. Please call me back in the evening.",
      "Hello, my name is Priya. I missed your call earlier. I am interested in office space pricing. Please call back.",
      "Namaste, I am Suresh. I need details about warehouse availability and monthly lease terms. Kindly call me back.",
      "Hi team, this is Kavya. I want to schedule a site visit for the apartment this weekend. Please contact me.",
      "Hello, this is Arjun. I had a bad experience because no one picked up. I still want information about the commercial property.",
      "Hi, I'm Neha. Please share details about the property loan support and payment options. Call me when possible.",
      "Good afternoon, this is Manoj. I want to check if the flat is still available and what the maintenance charges are.",
      "Hello, I am Swathi. I would like a callback regarding pricing and possession timeline for the property.",
      "Hi, this is Rahul. Please call me back. I need details about a shop space urgently.",
      "Namaste, my name is Deepa. I want to know whether the villa is pet-friendly and available next month."
    ];
  
    generateTranscript(): string {
      const index =
        Math.floor(
          Math.random() * this.samples.length
        );
  
      return this.samples[index];
    }
  }