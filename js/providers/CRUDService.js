define([
  'providers/Service',
], (
  Service,
) => {

  return class CRUDService extends Service {
    constructor(baseUrl = 'crud-endpoint') {
      super();
      this.baseUrl = baseUrl;
    }
    
    async findOne(id) {
      const { data } = await this.httpService.doGet(`${this.baseUrl}/${id}`);
      return data;
    }

    async find() {
      const { data = [] } = await this.httpService.doGet(`${this.baseUrl}`);
      return data;
    }

    async create(definition) {
      const { data } = await this.httpService.doPost(`${this.baseUrl}`, definition);
      return data;
    }

    async update(definition) {
      const { data } = await this.httpService.doPut(`${this.baseUrl}`, definition);
      return data;
    }

    async save(definition) {
      if (definition.id) {
        return this.update(definition);
      }

      return this.create(definition);
    }

    async delete(id) {
      const { data } = await this.httpService.doDelete(`${this.baseUrl}/${id}`);
      return data;
    }
  }

});