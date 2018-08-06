'use strict'
// @flow
import Application from './application'

export default class Listing {
  registry: Object
  application: Application

  constructor (registry: Object, application: Application) {
    if (!application) {
      throw new Error('Failed creating listing, application is invalid')
    }

    this.registry = registry
    this.application = application
  }

  async exit () {
    return this.registry.methods.exit(this.application.hash).send()
  }
}
