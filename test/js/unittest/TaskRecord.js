describe('TaskRecord', function() {
	var record;

	beforeEach(function() {
		record = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Task', {}, 1);
		record.store = {save: function() {}, remove: function() {}, modified: []};
	});

	describe('isTaskDelegated', function() {
		it('false', function() {
			expect(record.isTaskDelegated()).toBeFalsy();
		});

		it('true', function() {
			record.set('ownership', Zarafa.core.mapi.TaskOwnership.DELEGATEDTASK);
			expect(record.isTaskDelegated()).toBeTruthy();
		});
	});

	describe('isTaskOwner', function() {
		it('false', function() {
			expect(record.isTaskOwner()).toBeFalsy();
		});

		it('true', function() {
			record.set('ownership', Zarafa.core.mapi.TaskOwnership.OWNTASK);
			expect(record.isTaskOwner()).toBeTruthy();
		});
	});

	describe('isTaskReceived', function() {
		it('false', function() {
			expect(record.isTaskReceived()).toBeFalsy();
		});

		it('true', function() {
			record.set('taskstate', Zarafa.core.mapi.TaskState.OWNER);
			expect(record.isTaskReceived()).toBeTruthy();
		});
	});

	describe('isTaskAssigned', function() {
		it('false', function() {
			expect(record.isTaskAssigned()).toBeFalsy();
		});

		it('true', function() {
			record.set('taskhistory', Zarafa.core.mapi.TaskHistory.ASSIGNED);
			expect(record.isTaskAssigned()).toBeTruthy();
		});
	});

	describe('isTaskAccepted', function() {
		it('false', function() {
			expect(record.isTaskAccepted()).toBeFalsy();
		});

		it('true', function() {
			record.set('taskhistory', Zarafa.core.mapi.TaskHistory.ACCEPTED);
			expect(record.isTaskAccepted()).toBeTruthy();
		});
	});

	describe('isTaskUpdated', function() {
		it('false', function() {
			expect(record.isTaskUpdated()).toBeFalsy();
		});

		it('true', function() {
			record.set('taskhistory', Zarafa.core.mapi.TaskHistory.UPDATED);
			expect(record.isTaskUpdated()).toBeTruthy();
		});
	});

	describe('isNormalTask', function() {
		it('normal default', function() {
			expect(record.isNormalTask()).toBeTruthy();
		});

		it('owner', function() {
			record.set('taskstate', Zarafa.core.mapi.TaskState.OWNER);
			expect(record.isNormalTask()).toBeFalsy();
		});

		it('owner new', function() {
			record.set('taskstate', Zarafa.core.mapi.TaskState.ACCEPTED);
			expect(record.isNormalTask()).toBeFalsy();
		});
	});
	
	describe('isTaskDeclined', function() {
		it('default', function() {
			expect(record.isTaskDeclined()).toBeFalsy();
		});

		it('accepted and history declined', function() {
			record.set('taskstate', Zarafa.core.mapi.TaskState.DECLINE);
			record.set('taskhistory', Zarafa.core.mapi.TaskHistory.DECLINED);
			expect(record.isTaskDeclined()).toBeTruthy();
		});
	});

	describe('isDraftAssignedTask', function() {
		it('default', function() {
			expect(record.isDraftAssignedTask()).toBeFalsy();
		});

		it('owner new and request', function() {
			record.set('taskstate', Zarafa.core.mapi.TaskState.OWNER_NEW);
			record.set('taskmode', Zarafa.core.mapi.TaskMode.REQUEST);
			expect(record.isDraftAssignedTask()).toBeTruthy();
		});
	});


	describe('isTaskRequest', function() {
		it('false', function() {
			expect(record.isTaskRequest()).toBeFalsy();
		});

		it('true', function() {
			record.set('taskmode', Zarafa.core.mapi.TaskMode.NOTHING);
			record.set('message_class', 'IPM.TaskRequest');
			expect(record.isTaskRequest()).toBeTruthy();
		});
	});

	describe('isTaskOrganized', function() {
		it('false', function() {
			expect(record.isTaskOrganized()).toBeFalsy();
		});

		it('accepted', function() {
			record.set('taskstate', Zarafa.core.mapi.TaskState.ACCEPT);
			expect(record.isTaskOrganized()).toBeTruthy();
		});

		it('declined', function() {
			record.set('taskstate', Zarafa.core.mapi.TaskState.DECLINE);
			expect(record.isTaskOrganized()).toBeTruthy();
		});
	});	
	
	describe('generateTaskCommentsInfo', function() {
		it('no argument', function() {
			expect(record.generateTaskCommentsInfo()).toEqual('');
		});

		it('argument', function() {
			expect(record.generateTaskCommentsInfo('hello')).toEqual('hello');
		});

		it('body set', function() {
			record.set('body', 'body');
			expect(record.generateTaskCommentsInfo()).toEqual('\n---------\n' + 'body');
		});
		it('body set with argument', function() {
			record.set('body', 'body');
			expect(record.generateTaskCommentsInfo('woop')).toEqual('woop\n---------\n' + 'body');
		});
	});

	describe('sendTaskRequestResponse', function() {
		it('no argument', function() {
			expect(record.sendTaskRequestResponse()).toBeUndefined();
		});

		it('Zarafa.core.mapi.TaskMode.ACCEPT', function() {
			expect(record.sendTaskRequestResponse(Zarafa.core.mapi.TaskMode.ACCEPT)).toBeUndefined();
			expect(record.getMessageAction('action_type')).toEqual('acceptTaskRequest');
			expect(record.getMessageAction('response_type')).toEqual(Zarafa.core.mapi.TaskMode.ACCEPT);
			expect(record.get('taskhistory')).toEqual(Zarafa.core.mapi.TaskHistory.ACCEPTED);
		});

		it('Zarafa.core.mapi.TaskMode.DECLINE', function() {
			expect(record.sendTaskRequestResponse(Zarafa.core.mapi.TaskMode.DECLINE)).toBeUndefined();
			expect(record.getMessageAction('action_type')).toEqual('declineTaskRequest');
			expect(record.getMessageAction('response_type')).toEqual(Zarafa.core.mapi.TaskMode.DECLINE);
			expect(record.get('taskhistory')).toEqual(Zarafa.core.mapi.TaskHistory.DECLINED);
		});

		it('with comment', function() {
			expect(record.sendTaskRequestResponse(Zarafa.core.mapi.TaskMode.DECLINE, 'help', true)).toBeUndefined();
			expect(record.getMessageAction('action_type')).toEqual('declineTaskRequest');
			expect(record.getMessageAction('response_type')).toEqual(Zarafa.core.mapi.TaskMode.DECLINE);
			expect(record.getMessageAction('task_comments_info')).toEqual('help');
			expect(record.get('taskhistory')).toEqual(Zarafa.core.mapi.TaskHistory.DECLINED);
		});

	});

	describe('respondToTaskRequest', function() {
		it('default', function() {
			expect(record.respondToTaskRequest(Zarafa.core.mapi.TaskMode.DECLINE, 'help', true)).toBeUndefined();
			expect(record.getMessageAction('action_type')).toEqual('declineTaskRequest');
			expect(record.getMessageAction('response_type')).toEqual(Zarafa.core.mapi.TaskMode.DECLINE);
			expect(record.getMessageAction('task_comments_info')).toEqual('help');
			expect(record.get('taskhistory')).toEqual(Zarafa.core.mapi.TaskHistory.DECLINED);
		});	
		
		it('body set', function() {
			record.set('body', 'body');
			expect(record.respondToTaskRequest(Zarafa.core.mapi.TaskMode.DECLINE)).toBeUndefined();
			expect(record.getMessageAction('action_type')).toEqual('declineTaskRequest');
			expect(record.getMessageAction('response_type')).toEqual(Zarafa.core.mapi.TaskMode.DECLINE);
			expect(record.get('taskhistory')).toEqual(Zarafa.core.mapi.TaskHistory.DECLINED);
		});

		it('body set edit response true', function() {
			record.set('body', 'body');
			expect(record.respondToTaskRequest(Zarafa.core.mapi.TaskMode.DECLINE, 'body', true)).toBeUndefined();
			expect(record.getMessageAction('action_type')).toEqual('declineTaskRequest');
			expect(record.getMessageAction('response_type')).toEqual(Zarafa.core.mapi.TaskMode.DECLINE);
			expect(record.getMessageAction('task_comments_info')).toEqual('body\n---------\nbody');
			expect(record.get('taskhistory')).toEqual(Zarafa.core.mapi.TaskHistory.DECLINED);
		});
	});

	describe('deleteIncompleteTask', function() {
		it('normal', function() {
			record.deleteIncompleteTask();
			expect(record.getMessageAction('action_type')).toBeFalsy();
		});

		it('normal', function() {
			record.deleteIncompleteTask('declineAndDelete');
			expect(record.getMessageAction('action_type')).toEqual('declineAndDelete');
		});
	});

	describe('convertToTaskRequest', function() {
		it('normal', function() {
			record.convertToTaskRequest();
			expect(record.get('taskstate')).toEqual(Zarafa.core.mapi.TaskState.OWNER_NEW);
			expect(record.get('taskmode')).toEqual(Zarafa.core.mapi.TaskMode.REQUEST);
		});
	});
});
