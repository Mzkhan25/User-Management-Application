import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { compare, genSalt, hash } from 'bcryptjs';
import { ModelType } from 'typegoose';
import { AuthService } from '../shared/auth/auth.service';
import { JwtPayload } from '../shared/auth/jwt-payload.model';
import { BaseService } from '../shared/base.service';
import { MapperService } from '../shared/mapper/mapper.service';
import { User, UserModel } from './models/user.model';
import { LoginResponseVm } from './models/view-models/login-response-vm.model';
import { LoginVm } from './models/view-models/login-vm.model';
import { RegisterVm } from './models/view-models/register-vm.model';
import { UserVm } from './models/view-models/user-vm.model';

@Injectable()
export class UserService extends BaseService<User> {
    constructor(
        @InjectModel(User.modelName) private readonly _userModel: ModelType<User>,
        private readonly _mapperService: MapperService,
        @Inject(forwardRef(() => AuthService))
        readonly _authService: AuthService,
    ) {
        super();
        this._model = _userModel;
        this._mapper = _mapperService.mapper;
    }

    async register(vm: RegisterVm) {
        const { username, password, firstName, lastName, address, salary, age } = vm;

        const newUser = new UserModel();
        newUser.username = username.trim().toLowerCase();
        newUser.firstName = firstName;
        newUser.lastName = lastName;
        newUser.address = address;
        newUser.salary = salary;
        newUser.age = age;

        const salt = await genSalt(10);
        newUser.password = await hash(password, salt);

        try {
            const result = await this.create(newUser);
            return result.toJSON() as User;
        } catch (e) {
            throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateUser(vm: UserVm) {
        const { username, firstName, lastName, address, salary, age } = vm;

        const newUser = new UserModel();
        newUser.username = username.trim().toLowerCase();
        newUser.firstName = firstName;
        newUser.lastName = lastName;
        newUser.address = address;
        newUser.salary = salary;
        newUser.age = age;
        vm.username = vm.username.trim().toLowerCase();
        try {
            const result = await this.update(vm.id, newUser);
            return result.toJSON() as User;
        } catch (e) {
            throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAllUsers() {
        try {
            const result = await this.findAll();
            return result;
        } catch (e) {
            throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async ageFilter(userAge: number, oper: string, asc: boolean) {
        try {
            if (oper === 'lt')
            {
               const result = await this.findAll({age: {$lt: userAge }});
               return  result;
            }

            else if (oper === 'lte')
             {
                const result = await this.findAll({age: {$lte: userAge }});
                return  result;
             }
             else if (oper === 'gt')
             {
                 const result = await this.findAll({age: {$gt: userAge }});
                 return  result;
            }
             else if (oper === 'gte')
             {
                 const result = await this.findAll({age: {$gte: userAge }});
                 return  result;
            }
             else if (oper === 'eq')
             {
                 const result = await this.findAll({age: {$eq: userAge }});
                 return  result;
            }
             else if (oper === 'ne')
             {
                 const result = await this.findAll({age: {$ne: userAge }});
                 return  result;
            }
        } catch (e) {
            throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getUserById(id: string) {
        try {
            const result = await this.findById(id);
            return result;
        } catch (e) {
            throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async delete(id: string) {
        try {
            const result = await this.delete(id);
            return result;
        } catch (e) {
            throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async login(vm: LoginVm): Promise<LoginResponseVm> {
        const { username, password } = vm;

        const user = await this.findOne({ username });

        if (!user) {
            throw new HttpException('Invalid crendentials', HttpStatus.NOT_FOUND);
        }

        const isMatch = await compare(password, user.password);

        if (!isMatch) {
            throw new HttpException('Invalid crendentials', HttpStatus.BAD_REQUEST);
        }

        const payload: JwtPayload = {
            username: user.username,
            role: user.role,
        };

        const token = await this._authService.signPayload(payload);
        const userVm: UserVm = await this.map<UserVm>(user.toJSON());

        return {
            token,
            user: userVm,
        };
    }
}
