import { Get, Post, Delete, Put, Body, Param, Res, Req, JsonController, Authorized, CurrentUser, QueryParam } from 'routing-controllers';
import { Inject } from 'typedi';
import { Subscription, SubscriptionSubscribeForm } from './subscription.model';
import { Request, Response } from 'express';
import { Current, logger } from '@aitheon/core-server';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { SubscriptionsService } from './subscriptions.service';


@Authorized()
@JsonController('/api/subscriptions')
export class SubscriptionsController {

  @Inject()
  subscriptionsService: SubscriptionsService;


  @Get('/')
  @OpenAPI({ summary: 'List subscriptions', operationId: 'list' })
  @ResponseSchema(Subscription, { isArray: true })
  async list(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request) {
    try {
      const result = await this.subscriptionsService.list();
      return response.json(result);
    } catch (err) {
      logger.error('[list all subscriptions]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Post('/subscribe')
  @OpenAPI({ summary: 'Subscribe to subscription', operationId: 'subscribe' })
  @ResponseSchema(Subscription)
  async subscribe(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Body() body: SubscriptionSubscribeForm) {
    try {
      const result = await this.subscriptionsService.subscribe(body, current);
      return response.json(result);
    } catch (err) {
      logger.error('[Subscribe to subscription]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

}
