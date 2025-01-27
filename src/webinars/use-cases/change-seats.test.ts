import { ChangeSeats } from 'src/webinars/use-cases/change-seats';
import { InMemoryWebinarRepository } from 'src/webinars/adapters/webinar-repository.in-memory';
import { Webinar } from '../entities/webinar.entity';
import { User } from 'src/users/entities/user.entity';
import { WebinarNotFoundException } from '../exceptions/webinar-not-found';
import { WebinarNotOrganizerException } from '../exceptions/webinar-not-organizer';
import { WebinarTooManySeatsException } from '../exceptions/webinar-too-many-seats';
import { WebinarReduceSeatsException } from '../exceptions/webinar-reduce-seats';

describe('Feature : Change seats', () => {

  function expectWebinarToRemainUnchanged() {
    const webinar = webinarRepository.findByIdSync('webinar-id');
    expect(webinar?.props.seats).toEqual(100);
  }

  function whenUserChangeSeatsWith(payload: any) {
    useCase.execute(payload);
  }

  async function thenUpdatedWebinarSeatsShouldBe(seats: number) {
    const updatedWebinar = await webinarRepository.findById('webinar-id');
    expect(updatedWebinar?.props.seats).toEqual(seats);
  }
  // Initialisation de nos tests, boilerplates...
  let webinarRepository: InMemoryWebinarRepository;
  let useCase: ChangeSeats;

  const testUser = {
    alice: new User({
      id: 'alice-id',
      email: 'alice@example.com',
      password: 'secure-password', 
    }),
    bob: new User({
      id: 'bob-id',
      email: 'bob@example.com',
      password: 'secure-password', 
    }),
  };
  
  
  const webinar = new Webinar({
      id: 'webinar-id',
      organizerId: testUser.alice.props.id,
      title: 'Webinar title',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-01T01:00:00Z'),
      seats: 100,
  });

  beforeEach(() => {
      webinarRepository = new InMemoryWebinarRepository([webinar]);
      useCase = new ChangeSeats(webinarRepository);
  });
  describe('Scenario: Happy path', () => {
    // Code commun à notre scénario : payload...
    const payload = {
      user: testUser.alice,
      webinarId: 'webinar-id',
      seats: 200,
    };
    it('should change the number of seats for a webinar', async () => {
       // ACT
      await useCase.execute(payload);
       // ASSERT
       thenUpdatedWebinarSeatsShouldBe(payload.seats);
    });
  });

  describe('Scenario: webinar does not exist', () => {
    const payload = {
      webinarId: 'webinar-id',
    };
    it('should fail', async () => {
      expectWebinarToRemainUnchanged();
    });
  });

  describe('Scenario: update the webinar of someone else', () => {
    const payload = {
      user: testUser.bob, 
      webinarId: 'webinar-id',
      seats: 200,
    };
  
    it('should fail with WebinarNotOrganizerException', async () => {
      await expect(useCase.execute(payload)).rejects.toThrow(WebinarNotOrganizerException);
      expectWebinarToRemainUnchanged();
    });
  });
  

  describe('Scenario: change seat to an inferior number', () => {
    const payload = {
      user: testUser.alice,
      webinarId: 'webinar-id',
      seats: 50, 
    };
  
    it('should fail with WebinarReduceSeatsException', async () => {
      await expect(useCase.execute(payload)).rejects.toThrow(WebinarReduceSeatsException);
      expectWebinarToRemainUnchanged();
    });
  });
  

  describe('Scenario: change seat to a number > 1000', () => {
    const payload = {
      user: testUser.alice,
      webinarId: 'webinar-id',
      seats: 1500, 
    };
  
    it('should fail with WebinarTooManySeatsException', async () => {
      await expect(useCase.execute(payload)).rejects.toThrow(WebinarTooManySeatsException);
      expectWebinarToRemainUnchanged();
    });
  });  
});