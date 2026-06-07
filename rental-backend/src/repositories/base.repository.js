class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data, options = {}) {
    const isArray = Array.isArray(data);
    const payload = isArray ? data : [data];
    const createOptions = { ...options };

    // Mongoose requires ordered:true when bulk creating inside a transaction session
    if (isArray && options.session) {
      createOptions.ordered = true;
    }

    const result = await this.model.create(payload, createOptions);
    return isArray ? result : result[0];
  }

  async findById(id, options = {}) {
    const { select, populate, lean, session } = options;
    let query = this.model.findById(id);
    if (select) query = query.select(select);
    if (populate) query = query.populate(populate);
    if (session) query = query.session(session);
    if (lean) query = query.lean();
    return query.exec();
  }

  async findOne(filter = {}, options = {}) {
    const { select, populate, lean, session } = options;
    let query = this.model.findOne(filter);
    if (select) query = query.select(select);
    if (populate) query = query.populate(populate);
    if (session) query = query.session(session);
    if (lean) query = query.lean();
    return query.exec();
  }

  async find(filter = {}, options = {}) {
    const { select, populate, sort, skip, limit, lean, session } = options;
    let query = this.model.find(filter);
    if (select) query = query.select(select);
    if (populate) query = query.populate(populate);
    if (sort) query = query.sort(sort);
    if (skip !== undefined) query = query.skip(skip);
    if (limit !== undefined) query = query.limit(limit);
    if (session) query = query.session(session);
    if (lean) query = query.lean();
    return query.exec();
  }

  async findByIdAndUpdate(id, data, options = {}) {
    const { select, populate, lean, session, ...mongooseOptions } = options;
    if (mongooseOptions.new === undefined && mongooseOptions.returnDocument === undefined) {
      mongooseOptions.new = true;
    }
    if (session) {
      mongooseOptions.session = session;
    }
    let query = this.model.findByIdAndUpdate(id, data, mongooseOptions);
    if (select) query = query.select(select);
    if (populate) query = query.populate(populate);
    if (lean) query = query.lean();
    return query.exec();
  }

  async findOneAndUpdate(filter, data, options = {}) {
    const { select, populate, lean, session, ...mongooseOptions } = options;
    if (mongooseOptions.new === undefined && mongooseOptions.returnDocument === undefined) {
      mongooseOptions.new = true;
    }
    if (session) {
      mongooseOptions.session = session;
    }
    let query = this.model.findOneAndUpdate(filter, data, mongooseOptions);
    if (select) query = query.select(select);
    if (populate) query = query.populate(populate);
    if (lean) query = query.lean();
    return query.exec();
  }

  async findByIdAndDelete(id, options = {}) {
    return this.model.findByIdAndDelete(id, options).exec();
  }

  async deleteOne(filter = {}, options = {}) {
    return this.model.deleteOne(filter, options).exec();
  }

  async deleteMany(filter = {}, options = {}) {
    return this.model.deleteMany(filter, options).exec();
  }

  async countDocuments(filter = {}, options = {}) {
    let query = this.model.countDocuments(filter);
    if (options.session) query = query.session(options.session);
    return query.exec();
  }

  async updateMany(filter = {}, data = {}, options = {}) {
    return this.model.updateMany(filter, data, options).exec();
  }

  async updateOne(filter = {}, data = {}, options = {}) {
    return this.model.updateOne(filter, data, options).exec();
  }

  async aggregate(pipeline = [], options = {}) {
    let query = this.model.aggregate(pipeline);
    if (options.session) query = query.session(options.session);
    return query;
  }
}

export default BaseRepository;
