class Recorder {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.nameList = null;
    this.recordList = [];
    this.recordListUpdatedTime = new Date();
    this.recordListUpdatedTime.setHours(0, 0, 0, 0); // start of the day
    this.lastRecordTime = null;
    this.checkList = {};
  }

  updateCheckList() {
    const newCheckList = {};
    for (let i = 0; i < this.recordList.length; i++) {
      const [timestamp, id] = this.recordList[i];
      if (id in newCheckList) {
        newCheckList[id].out = new Date(timestamp);
      } else {
        newCheckList[id] = {
          in: new Date(timestamp),
          out: null,
        };
      }
    }
    this.checkList = newCheckList;
    return this.checkList;
  }

  async updateRecordList() {
    const afterTimestamp = this.recordListUpdatedTime.valueOf();
    this.recordListUpdatedTime = new Date();
    try {
      const response = await fetch(
        `${this.endpoint}?action=getRecordList&after=${afterTimestamp}`,
      );
      if (response.ok) {
        const newRecords = await response.json();
        newRecords.forEach((entry) => {
          const recordTime = new Date(entry[0]);
          if (
            this.lastRecordTime === null
            || recordTime > this.lastRecordTime
          ) {
            this.lastRecordTime = recordTime;
          }
        });
        if (newRecords.length > 0) {
          this.recordList = this.recordList.concat(newRecords);
        }
      }
      this.updateCheckList();
      return this.recordList;
    } catch (e) {
      this.recordListUpdatedTime = new Date(afterTimestamp);
      console.error(e);
      throw e;
    }
  }

  async updateNameList() {
    const response = await fetch(`${this.endpoint}?action=getNameList`);
    if (response.ok) {
      const nameListData = await response.json();
      this.nameList = {};
      for (let i = 0; i < nameListData.length; i++) {
        const [id, name] = nameListData[i];
        this.nameList[id] = name;
      }
      return this.nameList;
    }
  }

  async getNameList() {
    if (this.nameList === null) {
      return await this.updateNameList();
    }
    return this.nameList;
  }

  async getNameForId(id) {
    const nameList = await this.getNameList();
    return nameList[id];
  }

  async recordID(id) {
    const command = {
      action: 'recordID',
      id,
    };
    await fetch(this.endpoint, {
      mode: 'no-cors',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    });
  }

  async updateName(id, name) {
    if (this.nameList[id] === name) {
      return;
    }
    const command = {
      action: 'updateName',
      id,
      name,
    };
    await fetch(this.endpoint, {
      mode: 'no-cors',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    });
  }
}

export { Recorder };
