import Container, { Service, Inject } from 'typedi';
import { Subscription, SubscriptionSchema, SubscriptionSubscribeForm, SubscriptionType } from './subscription.model';
import { Current } from '@aitheon/core-server';


@Service()
export class SubscriptionsService {

  async list(): Promise<Subscription[]> {
    const query = {};
    return await SubscriptionSchema.find(query);
  }

  async create(type: string, reference: string, userId?: string): Promise<Subscription> {
    const body = { type, reference } as Subscription;
    if (userId) {
      body.users = [userId];
    }
    return await SubscriptionSchema.create(body);
  }

  async subscribe(body: SubscriptionSubscribeForm, current: Current): Promise<Subscription> {
    const query = {
      type: body.type,
      reference: body.reference
    };
    const existSubscription = (await SubscriptionSchema.findOne(query).lean()) as Subscription;

    if (!existSubscription) {
      return await this.create(body.type, body.reference, current.user._id);
    }

    const isSubscribed = existSubscription.users.find((user: string) => user == current.user._id);
    const subscriptionChanges = isSubscribed ? { $pull: { users: current.user._id }} : { $push: { users: current.user._id }};

    return await SubscriptionSchema.findByIdAndUpdate(existSubscription._id, subscriptionChanges, { new: true });
  }

  async getSubscribersForStage(stageId: string) {
    const subscription = await SubscriptionSchema.findOne({ type: SubscriptionType.STAGE, reference: stageId }).lean();
    return subscription ? subscription.users : [];
  }

}
