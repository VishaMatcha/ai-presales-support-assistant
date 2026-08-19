import { Inject, Injectable } from '@nestjs/common';
import { BitextKnowledgeBase } from './bitext-knowledge-base.js';
import type { KnowledgeBase } from './knowledge-base.js';

@Injectable()
export class KnowledgeBaseRegistry {
  private readonly stores = new Map<string, KnowledgeBase>();

  constructor(@Inject(BitextKnowledgeBase) bitext: BitextKnowledgeBase) {
    this.stores.set(bitext.name, bitext);
  }

  // This registry is the seam for another dataset, customer KB, or external platform tool.
  get(name = 'bitext-support'): KnowledgeBase {
    const store = this.stores.get(name);
    if (!store) throw new Error(`Knowledge base not registered: ${name}`);
    return store;
  }
}
