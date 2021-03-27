#include <iostream>
#include <fstream>
#include <typeinfo>
#include <cxxabi.h>

std::string DemangleTypeName (const char* name)
{
    int status = -4;
    char* demangled = abi::__cxa_demangle (name, NULL, NULL, &status);
	std::string result;
	if (status == 0) {
		result = demangled;
	} else {
		result = name;
	}
	delete[] demangled;
    return result;
}

class BinaryWriter
{
public:
	BinaryWriter (const std::string& logFileName, const std::string& binaryFileName)
	{
		logFile.open (logFileName.c_str (), std::ofstream::out);
		binaryFile.open (binaryFileName.c_str (), std::ofstream::binary);
	}
	
	~BinaryWriter ()
	{
		logFile.close ();
		binaryFile.close ();
	}
	
	template<class Type>
	void Write (Type value)
	{
		logFile << value << " (" << DemangleTypeName (typeid (value).name ()) << ", " << sizeof (value) << ")" << std::endl;
		binaryFile.write ((char*) &value, sizeof (value));
	}
	
private:
	std::ofstream logFile;
	std::ofstream binaryFile;
};

int main ()
{
	BinaryWriter bw ("result.txt", "result.bin");
	
	bw.Write ((bool) true);
	bw.Write ((bool) false);

	bw.Write ((char) 'a');
	bw.Write ((char) 'A');
	bw.Write ((unsigned char) 'a');
	bw.Write ((unsigned char) 'A');
	
	bw.Write ((short) 42);
	bw.Write ((short) -42);
	bw.Write ((short) 32000);
	bw.Write ((short) -32000);
	bw.Write ((unsigned short) 42);
	bw.Write ((unsigned short) -42);
	bw.Write ((unsigned short) 32000);
	bw.Write ((unsigned short) -32000);
	
	bw.Write ((int) 42);
	bw.Write ((int) -42);
	bw.Write ((int) 32000);
	bw.Write ((int) -32000);
	bw.Write ((int) 2000000000);
	bw.Write ((int) -2000000000);
	bw.Write ((unsigned int) 42);
	bw.Write ((unsigned int) -42);
	bw.Write ((unsigned int) 32000);
	bw.Write ((unsigned int) -32000);
	bw.Write ((unsigned int) 2000000000);
	bw.Write ((unsigned int) -2000000000);

	bw.Write ((long) 42);
	bw.Write ((long) -42);
	bw.Write ((long) 32000);
	bw.Write ((long) -32000);
	bw.Write ((long) 2000000000);
	bw.Write ((long) -2000000000);
	bw.Write ((unsigned long) 42);
	bw.Write ((unsigned long) -42);
	bw.Write ((unsigned long) 32000);
	bw.Write ((unsigned long) -32000);
	bw.Write ((unsigned long) 2000000000);
	bw.Write ((unsigned long) -2000000000);

	bw.Write ((float) 42);
	bw.Write ((float) -42);
	bw.Write ((float) 12345.6789);
	bw.Write ((float) -12345.6789);

	bw.Write ((double) 42);
	bw.Write ((double) -42);
	bw.Write ((double) 12345.6789);
	bw.Write ((double) -12345.6789);

	return 0;
}
