import { NextFunction, Router } from 'express';
import createHttpError from 'http-errors';

import { getDomains, isDomainAvailable, loadMoreDomains } from '../services';
import type {
  GetDomainStatusRequest,
  GetDomainStatusResponse,
  GetDomainsRequest,
  GetDomainsResponse, GetNewDomainsRequest,
} from './types';
import AiError from '../services/ai/AiError';


const domainRouter = Router();

// /v1/domains?desc="{App description}"
domainRouter.get(
  '/domains',
  async (
    req: GetDomainsRequest,
    res: GetDomainsResponse,
    next: NextFunction
  ) => {
    if (!req.query.desc) {
      return next(createHttpError(400, 'Query param `desc` is required'));
    }

    let domains;
    try {
      domains = await getDomains({
        desc: req.query.desc,
        tlds: req.query.tlds?.split(','),
      });
    } catch (err) {
      if (err instanceof AiError) {
        return next(createHttpError(400, err.message));
      }
    }

    res.json({ domains });
  }
);

// /v1/domain_status?domain="{domain}"
domainRouter.get(
  '/domain_status',
  async (
    req: GetDomainStatusRequest,
    res: GetDomainStatusResponse,
    next,
  ) => {
    const domain = req.query.domain;

    if (!domain) {
      return next(createHttpError(400, 'Query param `domain` is required'));
    }

    const isAvailable = await isDomainAvailable(domain);

    res.json({ isAvailable });
  }
);

domainRouter.get(
  '/get_more_domains',
  async (
    req: GetNewDomainsRequest,
    res: GetDomainsResponse,
    next: NextFunction
  ) => {
    let domains;
    try {
      domains = await loadMoreDomains();
    } catch (err) {
      if (err instanceof AiError) {
        return next(createHttpError(400, err.message));
      }
    }
    res.json({ domains });
  }
);

export { domainRouter };
