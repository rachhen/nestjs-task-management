import { Test } from '@nestjs/testing';
import { UserRepository } from './user.repository';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

const mockCredentialsDto = {
  username: 'TestUsername',
  password: 'TestPassword',
};

describe('UserRespository', () => {
  let userRespository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UserRepository],
    }).compile();

    userRespository = await module.get<UserRepository>(UserRepository);
  });

  describe('signUp', () => {
    let save;

    beforeEach(async () => {
      save = jest.fn();
      userRespository.create = jest.fn().mockReturnValue({ save });
    });

    it('successfully signs up the user', () => {
      save.mockResolvedValue(undefined);
      expect(userRespository.signUp(mockCredentialsDto)).resolves.not.toThrow();
    });

    it('throws a conflict exception as username already exists', () => {
      save.mockRejectedValue({ code: '23505' });
      expect(userRespository.signUp(mockCredentialsDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws a unhandle exception as username already exists', () => {
      save.mockRejectedValue({ code: '123432' });
      expect(userRespository.signUp(mockCredentialsDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('validateUserPassword', () => {
    let user;

    beforeEach(() => {
      userRespository.findOne = jest.fn();
      user = new User();
      user.username = 'TestUsername';
      user.validatePassword = jest.fn();
    });

    it('returns the username as validate is successfull', async () => {
      userRespository.findOne.mockResolvedValue(user);
      user.validatePassword.mockResolvedValue(true);

      const result = await userRespository.validateUserPassword(
        mockCredentialsDto,
      );
      expect(result).toEqual('TestUsername');
    });

    it('returns null as user cannot be found', async () => {
      userRespository.findOne.mockResolvedValue(null);
      const result = await userRespository.validateUserPassword(
        mockCredentialsDto,
      );
      expect(user.validatePassword).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('returns null as password is invalid', async () => {
      userRespository.findOne.mockResolvedValue(user);
      user.validatePassword.mockResolvedValue(false);
      const result = await userRespository.validateUserPassword(
        mockCredentialsDto,
      );
      expect(user.validatePassword).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    describe('hashPassword', () => {
      it('calls bcrypt.hash to generate a hash', async () => {
        bcrypt.hash = jest.fn().mockResolvedValue('testHash');
        expect(bcrypt.hash).not.toHaveBeenCalled();
        const result = await userRespository.hashPassword(
          'testPassword',
          'testSalt',
        );
        expect(bcrypt.hash).toHaveBeenCalledWith('testPassword', 'testSalt');
        expect(result).toEqual('testHash');
      });
    });
  });
});
